<?php
require 'login.php';

function get_quizz($full,$num) {
	global $host;
	global $dbname;
	global $user;
	global $password;
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=null;
	$name=null;
	if ($full) {
		$res=pg_query_params("select name from seminaire.games where id=$1",array($num)) or die('Request failed: '.pg_last_error());
		$name=pg_fetch_row($res);
		$name=$name[0];
		pg_free_result($res);
		$res=pg_query_params("select id,question,array_to_json(answers) as options,answer,explain_text,explain_link,media from (select unnest(questions) as que from seminaire.games where id=$1) as qu inner join seminaire.questions on questions.id=que",array($num)) or die('Request failed: '.pg_last_error());
	} else {
		$res=pg_query_params("select id,question,array_to_json(answers) as options from (select unnest(questions) as que from seminaire.games where id=$1) as qu inner join seminaire.questions on questions.id=que",array($num)) or die('Request failed: '.pg_last_error());
	}
	$quizz=pg_fetch_all($res);
	foreach ($quizz as $key=>$question) {
		$quizz[$key]['options']=json_decode($quizz[$key]['options']);
		if ($full) {
			if ($quizz[$key]['explain_text']!=NULL && strlen($quizz[$key]['explain_text'])>0) {
				$quizz[$key]['explain']=array("text"=>$quizz[$key]['explain_text'],"link"=>$quizz[$key]['explain_link']);
			} else {
				$quizz[$key]['explain']=array("text"=>NULL,"link"=>NULL);
			}
			unset($quizz[$key]['explain_text']);
			unset($quizz[$key]['explain_link']);
		}
	}
	header("Content-Type: application/json");
	if ($full) $quizz=array("name"=>$name,"questions"=>$quizz);
	echo json_encode($quizz);
	pg_free_result($res);
	pg_close($dbconn);
}

if (array_key_exists('current',$_POST)) {	// Retourne la question courante
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select val from seminaire.state where id=$1",array($_POST['current'])) or die('Request failed: '.pg_last_error());
	$row=pg_fetch_row($res);
	if (count($row)>0) echo $row[0];
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('reset',$_POST)) {	// Vide le tableau des réponses et réinitialise la question courante
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("delete from seminaire.answers where game=$1",array($_POST['reset'])) or die('Request failed: '.pg_last_error());
	pg_free_result($res);
	echo "OK";
	pg_query_params("update seminaire.state set val=null where id=$1",array($_POST['reset'])) or pg_query_params("insert into seminaire.state (id) values ($1)",array($_POST['reset'])) or die();
	pg_close($dbconn);
}
elseif (array_key_exists('set',$_POST)) {	// Définit la question courante
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("update seminaire.state set val=$1 where id=$2",array($_POST['set'],$_POST['game'])) or pg_query_params("insert into seminaire.state (id,val) values ($1,$2)",array($_POST['game'],$_POST['set'])) or die('Request failed: '.pg_last_error());
	echo "OK";
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('agent',$_POST)) {	// Enregistre la réponse dans la base
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select val from seminaire.state where id=$1",array($_POST['game'])) or die('Request failed: '.pg_last_error());
	$quest=pg_fetch_row($res)[0];
	pg_free_result($res);
	if ($quest==$_POST['question']) {
		$res=pg_query_params("insert into seminaire.answers (agent,question,answer,game) values ($1,$2,$3,$4)",array($_POST['agent'],$_POST['question'],$_POST['answer'],$_POST['game']));
	} else $res=NULL;
	if (!$res) {
		echo "KO";
	} else {
		echo "OK";
		pg_free_result($res);
	}
	pg_close($dbconn);
}
elseif (array_key_exists('stats-answer',$_POST)) {	// Statistiques pour une question
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select equipe,answer,count(*) as nombre from seminaire.answers inner join seminaire.agents on answers.agent=agents.id where question=$1 and game=$2 group by equipe,answer order by equipe,answer",array($_POST['stats-answer'],$_POST['game'])) or die('Request failed: '.pg_last_error());
	$stats=pg_fetch_all($res);
	header("Content-Type: application/json");
	echo json_encode($stats);
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('stats-teams',$_POST)) {	// Statistiques des équipes
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select equipe,seminaire.score((select count(*) from seminaire.answers inner join seminaire.agents on answers.agent=agents.id inner join seminaire.questions on questions.id=answers.question where answers.answer=questions.answer and agents.equipe=ag.equipe and game=$1)::integer,(select count(*) from seminaire.answers inner join seminaire.agents on answers.agent=agents.id inner join seminaire.questions on questions.id=answers.question where answers.answer!=questions.answer and agents.equipe=ag.equipe and game=$1)::integer) as score from seminaire.agents as ag group by equipe order by equipe;",array($_POST['stats-teams'])) or die('Request failed: '.pg_last_error());
	$answers=pg_fetch_all($res);
	$scores=array();
	foreach ($answers as $answer) $scores[$answer['equipe']]=$answer['score'];
	header("Content-Type: application/json");
	echo json_encode($scores);
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('stats-units',$_POST)) {	// Statistiques des services
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select direction,seminaire.score((select count(*) from seminaire.answers inner join seminaire.agents on answers.agent=agents.id inner join seminaire.questions on questions.id=answers.question where answers.answer=questions.answer and agents.direction=ag.direction and game=$1)::integer,(select count(*) from seminaire.answers inner join seminaire.agents on answers.agent=agents.id inner join seminaire.questions on questions.id=answers.question where answers.answer!=questions.answer and agents.direction=ag.direction and game=$1)::integer) as score from seminaire.agents as ag group by direction order by direction;",array($_POST['stats-units'])) or die('Request failed: '.pg_last_error());
	$answers=pg_fetch_all($res);
	$scores=array();
	foreach ($answers as $answer) $scores[$answer['direction']]=$answer['score'];
	header("Content-Type: application/json");
	echo json_encode($stats);
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('best-agents',$_POST)) {	// Podium des trois agents avec les scores les plus élevés
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select score,array_to_json(array_agg(nom)) as noms from (select concat(prenom,' ',nom) as nom,seminaire.score((select count(*) from seminaire.answers inner join seminaire.questions on questions.id=answers.question where answers.answer=questions.answer and answers.agent=ag.id and game=$1)::integer,(select count(*) from seminaire.answers inner join seminaire.questions on questions.id=answers.question where answers.answer!=questions.answer and answers.agent=ag.id and game=$1)::integer) as score from seminaire.agents as ag group by id,prenom,nom) as foo group by score order by score desc limit 3;",array($_POST['best-agents'])) or die('Request failed: '.pg_last_error());
	$answers=pg_fetch_all($res);
	foreach ($answers as $key=>$answer) {
		$answers[$key]['noms']=json_decode($answers[$key]['noms']);
	}
	header("Content-Type: application/json");
	echo json_encode($answers);
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('get_quizz',$_POST)) {	// Retourne le quizz complet
	get_quizz(True,$_POST['get_quizz']);
}
elseif (array_key_exists('quizz',$_POST)) {	// Retourne le quizz sans les réponses
	get_quizz(False,$_POST['quizz']);
}
elseif (array_key_exists('get-my-score',$_POST)) {	// Retourne le nombre de points d'un agent
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select seminaire.score((select count(*) from seminaire.answers inner join seminaire.questions on questions.id=answers.question where answers.answer=questions.answer and answers.agent=$1 and game=$2)::integer,(select count(*) from seminaire.answers inner join seminaire.questions on questions.id=answers.question where answers.answer!=questions.answer and answers.agent=$1 and game=$2)::integer) as score;",array($_POST['get-my-score'],$_POST['game'])) or die('Request failed: '.pg_last_error());
	$row=pg_fetch_row($res);
	if (count($row)>0) echo $row[0];
	pg_free_result($res);
	pg_close($dbconn);
}
?>
