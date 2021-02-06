<?php
require 'login.php';

if ($_SERVER['REQUEST_METHOD']==='GET') {	// Retourne le quizz sans les réponses
	$quizz=file_get_contents("quizz.json");
	$questions=json_decode($quizz,TRUE);
	foreach ($questions as &$question) {
		unset($question['answer']);
		unset($question['explain']);
		unset($question['category']);
	}
	header("Content-Type: application/json");
	echo json_encode($questions);
} else {
	if (array_key_exists('action',$_POST))	{	
		if ($_POST['action']=='current') {	// Retourne la question courante
			$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
			$query="select val from seminaire.state where id=1";
			$res=pg_query($query) or die('Request failed: '.pg_last_error());
			$row=pg_fetch_row($res);
			if (count($row)>0) echo $row[0];
			pg_free_result($res);
			pg_close($dbconn);
		}
		elseif ($_POST['action']=='reset') {	// Vide le tableau des réponses et réinitialise la question courante
			$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
			$res=pg_query("delete from seminaire.answers") or die('Request failed: '.pg_last_error());
			pg_free_result($res);
			echo "OK";
			pg_query("update seminaire.state set val=null where id=1") or pg_query("insert into seminaire.state (id) values (1)") or die();
			pg_close($dbconn);
		}
		elseif ($_POST['action']=='stats-teams') {	// Statistiques des équipes
			$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
			$res=pg_query("select question,equipe,answer,count(*) as nombre from seminaire.answers inner join seminaire.agents on answers.agent=agents.id group by question,equipe,answer order by question,equipe,answer") or die('Request failed: '.pg_last_error());
			$answers=pg_fetch_all($res);
			$quizz=file_get_contents("quizz.json");
			$questions=json_decode($quizz,TRUE);
			$stats=array();
			foreach ($answers as $answer) {
				$equipe=intval($answer['equipe']);
				$question=intval($answer['question']);
				if (!array_key_exists($equipe,$stats)) $stats[$equipe]=array();
				if (!array_key_exists($question,$stats[$equipe])) $stats[$equipe][$question]=array(0,0);
				if ($answer['answer']==$questions[$question]['answer']) $stats[$equipe][$question][0]+=$answer['nombre']; else $stats[$equipe][$question][1]+=$answer['nombre'];
			}
			header("Content-Type: application/json");
			echo json_encode($stats);
			pg_free_result($res);
			pg_close($dbconn);
		}
		elseif ($_POST['action']=='stats-units') {	// Statistiques des entités
			$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
			$res=pg_query("select question,service,answer,count(*) as nombre from seminaire.answers inner join seminaire.agents on answers.agent=agents.id group by question,service,answer order by question,service,answer") or die('Request failed: '.pg_last_error());
			$answers=pg_fetch_all($res);
			$quizz=file_get_contents("quizz.json");
			$questions=json_decode($quizz,TRUE);
			$stats=array();
			foreach ($answers as $answer) {
				$service=$answer['service'];
				$question=intval($answer['question']);
				if (!array_key_exists($service,$stats)) $stats[$service]=array();
				if (!array_key_exists($question,$stats[$service])) $stats[$service][$question]=array(0,0);
				if ($answer['answer']==$questions[$question]['answer']) $stats[$service][$question][0]+=$answer['nombre']; else $stats[$service][$question][1]+=$answer['nombre'];
			}
			header("Content-Type: application/json");
			echo json_encode($stats);
			pg_free_result($res);
			pg_close($dbconn);
		}
		elseif ($_POST['action']=='best-agents') {	// Meilleurs scores par individu
			$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
			$res=pg_query("select answers.agent,question,concat(agents.prenom,' ',agents.nom) as nom,answer from seminaire.answers inner join seminaire.agents on answers.agent=agents.id order by question,answers.agent,answer") or die('Request failed: '.pg_last_error());
			$answers=pg_fetch_all($res);
			$quizz=file_get_contents("quizz.json");
			$questions=json_decode($quizz,TRUE);
			$stats=array();
			foreach ($answers as $answer) {
				$nom=$answer['nom'];
				$question=intval($answer['question']);
				if (!array_key_exists($nom,$stats)) $stats[$nom]=0;
				if ($answer['answer']==$questions[$question]['answer']) $stats[$nom]+=3; else $stats[$nom]-=1;
			}
			arsort($stats,SORT_NUMERIC);
			$scores=array();
			$best=100000;
			$last=-1;
			foreach ($stats as $key => $val) {
				if ($val==$best) array_push($scores[$last][1],$key);
				else {
					$best=$val;
					$last+=1;
					array_push($scores,array($val,array($key)));
				}
				if ($last==3) break;
			}
			header("Content-Type: application/json");
			echo json_encode($scores);
			pg_free_result($res);
			pg_close($dbconn);
		}
	} 
	elseif (array_key_exists('set',$_POST)) {	// Définit la question courante
		$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
		$res=pg_query_params("update seminaire.state set val=$1 where id=1",array($_POST['set'])) or die('Request failed: '.pg_last_error());
		echo "OK";
		pg_free_result($res);
		pg_close($dbconn);
	}
	elseif (array_key_exists('agent',$_POST)) {	// Enregistre la réponse dans la base
		$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
		$res=pg_query("select val from seminaire.state where id=1") or die('Request failed: '.pg_last_error());
		$quest=pg_fetch_row($res)[0];
		pg_free_result($res);
		if ($quest==$_POST['question']) {
			$res=pg_query_params("insert into seminaire.answers values ($1,$2,$3)",array($_POST['agent'],$_POST['question'],$_POST['answer']));
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
		$res=pg_query_params("select equipe,answer,count(*) as nombre from seminaire.answers inner join seminaire.agents on answers.agent=agents.id where question=$1 group by equipe,answer order by equipe,answer",array($_POST['stats-answer'])) or die('Request failed: '.pg_last_error());
		$stats=pg_fetch_all($res);
		header("Content-Type: application/json");
		echo json_encode($stats);
		pg_free_result($res);
		pg_close($dbconn);
	}
}
?>
