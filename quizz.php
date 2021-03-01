<?php
require 'login.php';

function decode_array($s) {
	$s=str_replace('"','\\"',$s);
	$s='["'.$s.'"]';
	$s=str_replace('|','","',$s);
	return json_decode($s);
}

function get_quizz($full,$id,$admin) {
	global $host;
	global $dbname;
	global $user;
	global $password;
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=null;
	$game=null;
	if ($admin || $full) {
		$res=pg_query_params("select name,questions,pkey from seminaire.games where cd_game=$1",array($id)) or die('Request failed: '.pg_last_error());
		$game=pg_fetch_row($res);
		pg_free_result($res);
	}
	if ($admin) {
		$res=pg_query_params("select cd_question,question,array_to_string(answers,'|') as options,right_answer,explain_text,explain_link,explain_media,media,cd_game from seminaire.questions where cd_game is null or cd_game=$1",array($id)) or die('Request failed: '.pg_last_error());
	} elseif ($full) {
			$res=pg_query_params("select cd_question,question,array_to_string(answers,'|') as options,right_answer,explain_text,explain_link,explain_media,media from (select questions[nr] as que,nr from (select *,generate_subscripts(questions,1) as nr from seminaire.games where cd_game=$1) t) as qu inner join seminaire.questions on questions.cd_question=que order by nr;",array($id)) or die('Request failed: '.pg_last_error());
	} else {
		$res=pg_query_params("select cd_question,question,array_to_string(answers,'|') as options from (select questions[nr] as que,nr from (select *,generate_subscripts(questions,1) as nr from seminaire.games where pkey=$1) t) as qu inner join seminaire.questions on questions.cd_question=que order by nr;",array($id)) or die('Request failed: '.pg_last_error());
	}
	$quizz=pg_fetch_all($res);
	foreach ($quizz as $key=>$question) {
		$quizz[$key]['options']=decode_array($quizz[$key]['options']);
		if ($full || $admin) {
			if (($quizz[$key]['explain_text']!=NULL && $quizz[$key]['explain_text']!='') || ($quizz[$key]['explain_media']!=NULL && $quizz[$key]['explain_media']!='')) {
				$quizz[$key]['explain']=array("text"=>$quizz[$key]['explain_text'],"link"=>$quizz[$key]['explain_link'],"media"=>$quizz[$key]['explain_media']);
			} else {
				$quizz[$key]['explain']=array("text"=>NULL,"link"=>NULL,"media"=>NULL);
			}
			unset($quizz[$key]['explain_text']);
			unset($quizz[$key]['explain_link']);
			unset($quizz[$key]['explain_media']);
		}
	}
	if ($admin) {
		$qu=array();
		foreach ($quizz as $question) {
			$id=$question['cd_question'];
			unset($question['cd_question']);
			$qu[$id]=$question;
		}
		$quizz=$qu;
		$game[1][0]='[';
		$game[1][strlen($game[1])-1]=']';
		$quizz=array("name"=>$game[0],"setquestions"=>json_decode($game[1]),"pkey"=>$game[2],"questions"=>$quizz);
	} elseif ($full) $quizz=array("name"=>$game[0],"questions"=>$quizz);
	header("Content-Type: application/json");
	echo json_encode($quizz);
	pg_free_result($res);
	pg_close($dbconn);
}

/************************************
 *           Player API             *
 ************************************/
if (array_key_exists('current',$_POST)) {	// Return the current viewed question
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select val from seminaire.state inner join seminaire.games using (cd_game) where pkey=$1",array($_POST['current'])) or die('Request failed: '.pg_last_error());
	$row=pg_fetch_row($res);
	echo $row[0];
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('agent',$_POST)) {	// Save an answer in the database
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select cd_game,val from seminaire.state inner join seminaire.games using (cd_game) where pkey=$1",array($_POST['game'])) or die('Request failed: '.pg_last_error());
	$row=pg_fetch_row($res);
	$quest=$row[1];
	$game=$row[0];
	pg_free_result($res);
	if ($quest==$_POST['question']) {
		$res=pg_query_params("insert into seminaire.answers (cd_agent,cd_question,answer,cd_game) values ($1,$2,$3,$4)",array($_POST['agent'],$_POST['question'],$_POST['answer'],$game));
	} else $res=NULL;
	if (!$res) {
		echo "KO";
	} else {
		echo "OK";
		pg_free_result($res);
	}
	pg_close($dbconn);
}
elseif (array_key_exists('quizz',$_POST)) {	// Return the quizz for a game without the answers
	get_quizz(False,$_POST['quizz'],False);
}
elseif (array_key_exists('get-my-score',$_POST)) {	// Return the score of a player
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select seminaire.score((select count(*) from seminaire.answers inner join seminaire.games using (cd_game) inner join seminaire.questions using (cd_question) where answers.answer=questions.right_answer and answers.cd_agent=$1 and pkey=$2)::integer,(select count(*) from seminaire.answers inner join seminaire.games using (cd_game) inner join seminaire.questions using (cd_question) where answers.answer!=questions.right_answer and answers.cd_agent=$1 and pkey=$2)::integer) as score;",array($_POST['get-my-score'],$_POST['game'])) or die('Request failed: '.pg_last_error());
	$row=pg_fetch_row($res);
	if (count($row)>0) echo $row[0];
	pg_free_result($res);
	pg_close($dbconn);
}
/************************************
 *         Presenter API            *
 ************************************/
elseif (array_key_exists('reset',$_POST)) {	// Clear the answers table and initialize the current question to null (all participants are waiting for the first question)
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("delete from seminaire.answers where cd_game=$1",array($_POST['reset'])) or die('Request failed: '.pg_last_error());
	pg_free_result($res);
	pg_query_params("insert into seminaire.state (cd_game) values ($1)",array($_POST['reset'])) or pg_query_params("update seminaire.state set val=null where cd_game=$1",array($_POST['reset'])) or die();
	echo "OK";
	pg_close($dbconn);
}
elseif (array_key_exists('set',$_POST)) {	// Set the current question
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("update seminaire.state set val=$1 where cd_game=$2",array($_POST['set'],$_POST['game'])) or pg_query_params("insert into seminaire.state (cd_game,val) values ($1,$2)",array($_POST['game'],$_POST['set'])) or die('Request failed: '.pg_last_error());
	echo "OK";
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('stats-answer',$_POST)) {	// Statistics for a question
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select equipe,answer,count(*) as nombre from seminaire.answers inner join seminaire.agents on answers.cd_agent=agents.cd_agent where cd_question=$1 and cd_game=$2 group by equipe,answer order by equipe,answer",array($_POST['stats-answer'],$_POST['game'])) or die('Request failed: '.pg_last_error());
	$stats=pg_fetch_all($res);
	header("Content-Type: application/json");
	echo json_encode($stats);
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('stats-teams',$_POST)) {	// Statistics for teams
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select equipe,seminaire.score((select count(*) from seminaire.answers inner join seminaire.agents on answers.cd_agent=agents.cd_agent inner join seminaire.questions on questions.cd_question=answers.cd_question where answers.answer=questions.right_answer and agents.equipe=ag.equipe and answers.cd_game=$1)::integer,(select count(*) from seminaire.answers inner join seminaire.agents on answers.cd_agent=agents.cd_agent inner join seminaire.questions on questions.cd_question=answers.cd_question where answers.answer!=questions.right_answer and agents.equipe=ag.equipe and answers.cd_game=$1)::integer) as score from seminaire.agents as ag group by equipe order by equipe;",array($_POST['stats-teams'])) or die('Request failed: '.pg_last_error());
	$answers=pg_fetch_all($res);
	$scores=array();
	foreach ($answers as $answer) $scores[$answer['equipe']]=$answer['score'];
	header("Content-Type: application/json");
	echo json_encode($scores);
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('stats-units',$_POST)) {	// Statistics for entities
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select direction,seminaire.score((select count(*) from seminaire.answers inner join seminaire.agents on answers.cd_agent=agents.cd_agent inner join seminaire.questions on questions.cd_question=answers.cd_question where answers.answer=questions.right_answer and agents.direction=ag.direction and answers.cd_game=$1)::integer,(select count(*) from seminaire.answers inner join seminaire.agents on answers.cd_agent=agents.cd_agent inner join seminaire.questions on questions.cd_question=answers.cd_question where answers.answer!=questions.right_answer and agents.direction=ag.direction and answers.cd_game=$1)::integer) as score from seminaire.agents as ag group by direction order by direction;",array($_POST['stats-units'])) or die('Request failed: '.pg_last_error());
	$answers=pg_fetch_all($res);
	$scores=array();
	foreach ($answers as $answer) $scores[$answer['direction']]=$answer['score'];
	header("Content-Type: application/json");
	echo json_encode($stats);
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('best-agents',$_POST)) {	// Get the three highest scores and the associated players
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select score,array_agg(nom) as noms from (select concat(prenom,' ',nom) as nom,seminaire.score((select count(*) from seminaire.answers inner join seminaire.questions on questions.cd_question=answers.cd_question where answers.answer=questions.right_answer and answers.cd_agent=ag.cd_agent and answers.cd_game=$1)::integer,(select count(*) from seminaire.answers inner join seminaire.questions on questions.cd_question=answers.cd_question where answers.answer!=questions.right_answer and answers.cd_agent=ag.cd_agent and answers.cd_game=$1)::integer) as score from seminaire.agents as ag group by cd_agent,prenom,nom) as foo group by score order by score desc limit 3;",array($_POST['best-agents'])) or die('Request failed: '.pg_last_error());
	$answers=pg_fetch_all($res);
	foreach ($answers as $key=>$answer) {
		$answers[$key]['noms'][0]='[';
		$answers[$key]['noms'][strlen($answers[$key]['noms'])-1]=']';
		$answers[$key]['noms']=json_decode($answers[$key]['noms']);
	}
	header("Content-Type: application/json");
	echo json_encode($answers);
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('get_quizz',$_POST)) {	// Return the quizz for a game with the answers
	get_quizz(True,$_POST['get_quizz'],False);
}
/************************************
 *           Admin API              *
 ************************************/
elseif (array_key_exists('get-questions',$_POST)) {	// Return the list of questions
	get_quizz(True,$_POST['get-questions'],True);
}
elseif (array_key_exists('add-question',$_POST)) {	// Add a question to the database
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("insert into seminaire.questions (question,answers,right_answer,explain_text,explain_link,cd_game) values ($1,$2,$3,$4,$5,$6) returning cd_question",array($_POST['question'],$_POST['answers'],$_POST['rightanswer'],$_POST['explaintext'],$_POST['explainlink'],$_POST['add-question'])) or die('Request failed: '.pg_last_error());
	$row=pg_fetch_row($res);
	if (count($row)>0) echo $row[0];
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('update-question',$_POST)) {	// Change a question in the database
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	if (array_key_exists('question',$_POST)) {
		if (array_key_exists('answers',$_POST)) {
			$res=pg_query_params("update seminaire.questions set question=$1,answers=$2,right_answer=$3,explain_text=$4,explain_link=$5 where cd_question=$6",array($_POST['question'],$_POST['answers'],$_POST['rightanswer'],$_POST['explaintext'],$_POST['explainlink'],$_POST['update-question'])) or die('Request failed: '.pg_last_error());
		} else {
			$res=pg_query_params("update seminaire.questions set question=$1 where cd_question=$2",array($_POST['question'],$_POST['update-question'])) or die('Request failed: '.pg_last_error());
		}
	} else {
		$res=pg_query_params("update seminaire.questions set answers=$1,right_answer=$2,explain_text=$3,explain_link=$4 where cd_question=$5",array($_POST['answers'],$_POST['rightanswer'],$_POST['explaintext'],$_POST['explainlink'],$_POST['update-question'])) or die('Request failed: '.pg_last_error());
	}
	echo "OK";
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('delete-question',$_POST)) {	// Delete a question from the database
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("delete from seminaire.questions where cd_question=$1",array($_POST['delete-question'])) or die('Request failed: '.pg_last_error());
	echo "OK";
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('create-game',$_POST)) {	// Create a new game
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("insert into seminaire.games (questions,name) values ('{}',$1) returning cd_game,pkey",array($_POST['create-game'])) or die('Request failed: '.pg_last_error());
	$row=pg_fetch_assoc($res);
	header("Content-Type: application/json");
	echo json_encode($row);
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('update-game',$_POST)) {	// Update a game
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("update seminaire.games set name=$1,questions=$2 where cd_game=$3",array($_POST['name'],$_POST['questions'],$_POST['update-game'])) or die('Request failed: '.pg_last_error());
	echo "OK";
	pg_free_result($res);
	pg_close($dbconn);
}
?>
