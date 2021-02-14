<?php
require 'login.php';

function shuffle_once($arr) {
	$num=count($arr);
	$res=array_fill(0,$num,'');
	$rem=$num;
	$cur=0;
	while ($rem>3) {
		$step=rand(1,$rem-1);
		$pair=$cur;
		for ($i=0;$i<$step;$i++) {
			do {
				$pair=($pair+1)%$num;
			} while ($res[$pair]!='');
		}
		$res[$cur]=strval($pair);
		$res[$pair]=strval($cur);
		$rem-=2;
		$step=rand(1,$rem-1);
		for ($i=0;$i<$step;$i++) {
			do {
				$cur=($cur+1)%$num;
			} while ($res[$cur]!='');
		}
	}
	$remainders=array();
	for ($i=0;$i<$num;$i++) if ($res[$i]=='') array_push($remainders,$i);
	if ($rem==3) {
		$res[$remainders[0]]=strval($remainders[1]).','.strval($remainders[2]);
		$res[$remainders[1]]=strval($remainders[0]).','.strval($remainders[2]);
		$res[$remainders[2]]=strval($remainders[0]).','.strval($remainders[1]);
	} else {
		$res[$remainders[0]]=strval($remainders[1]);
		$res[$remainders[1]]=strval($remainders[0]);
	}
	$score=0;
	for ($i=0;$i<$num;$i++) {
		$newpair='';
		$pair=strtok($res[$i],',');
		while ($pair!==false) {
			$pair=intval($pair);
			if ($arr[$i]['direction']==$arr[$pair]['direction']) {
				$score+=1;
				if ($arr[$i]['service']==$arr[$pair]['service']) {
					$score+=10;
					if ($arr[$i]['unite']==$arr[$pair]['unite']) $score+=100;
				}
			}
			if ($arr[$i]['site']==$arr[$pair]['site']) $score+=20;
			if ($newpair!='') $newpair=$newpair.',';
			$newpair=$newpair.strval($arr[$pair]['cd_agent']);
			$res[$i]=$newpair;
			$pair=strtok(',');
		}
	}
	return array($res,$score);
}

function shuffle_best($arr,$num) {
	$best=1000000;
	for ($i=0;$i<$num;$i++) {
		$res=shuffle_once($arr);
		if ($res[1]<$best) {
			$bestshuffle=$res[0];
			$best=$res[1];
		}
	}
	return array($bestshuffle,$best);
}

if (array_key_exists('action',$_POST))	{	// Action sans paramètre
	if ($_POST['action']=="list") {	// Liste des agents
		$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
		$query="select cd_agent,nom,prenom from seminaire.agents order by nom,prenom";
		$res=pg_query($query) or die('Request failed: '.pg_last_error());
		$val=array();
		while ($row=pg_fetch_row($res)) array_push($val,$row);
		header("Content-Type: application/json");
		echo json_encode($val);
		pg_free_result($res);
		pg_close($dbconn);
	}
	elseif ($_POST['action']=="view_pairs") {	// Liste des agents
		$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
		$query="select concat(a.nom,' ',a.prenom) as first,string_agg(concat(b.nom,' ',b.prenom),',') as second from seminaire.agents a inner join seminaire.agents b on cast(b.cd_agent as text) in (select regexp_split_to_table(a.paire,',')) group by first";
		$res=pg_query($query) or die('Request failed: '.pg_last_error());
		$val=array();
		while ($row=pg_fetch_row($res)) array_push($val,$row);
		header("Content-Type: application/json");
		echo json_encode($val);
		pg_free_result($res);
		pg_close($dbconn);
	}
	elseif ($_POST['action']=="reset_pres") {	// Réinitialise les présences
		$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
		$query="update seminaire.agents set present=false";
		$res=pg_query($query) or die('Request failed: '.pg_last_error());
		pg_free_result($res);
		echo "OK";
		pg_close($dbconn);
	}
	elseif ($_POST['action']=="reset_pairs") {	// Réinitialise les paires
		$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
		$query="update seminaire.agents set paire=''";
		$res=pg_query($query) or die('Request failed: '.pg_last_error());
		pg_free_result($res);
		echo "OK";
		pg_close($dbconn);
	}
	elseif ($_POST['action']=="shuffle") { // Génère les paires
		srand();
		$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
		$query="select * from seminaire.agents where present=true";
		$res=pg_query($query) or die('Request failed: '.pg_last_error());
		$val=pg_fetch_all($res);
		pg_free_result($res);
		$best=shuffle_best($val,500);
		for ($i=0;$i<count($val);$i++) {
			pg_query_params("update seminaire.agents set paire=$1 where cd_agent=$2",array($best[0][$i],$val[$i]['cd_agent'])) or die('Request failed: '.pg_last_error());
		}
		echo "Score : {$best[1]}";
		pg_close($dbconn);
	}
} 
elseif (array_key_exists('id',$_POST)) { // Details
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select * from seminaire.agents where cd_agent=$1",array($_POST['id'])) or die('Request failed: '.pg_last_error());
	$val=pg_fetch_array($res,null,PGSQL_ASSOC);
	header("Content-Type: application/json");
	echo json_encode($val);
	pg_free_result($res);
	pg_close($dbconn);
}
elseif (array_key_exists('register',$_POST)) { // Enregistrement
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select cd_agent from seminaire.agents where concat(nom,' ',prenom)=$1",array($_POST['register'])) or die('Request failed: '.pg_last_error());
	$val=pg_fetch_row($res);
	pg_free_result($res);
	if (!$val) {
		echo "KO";
		return;
	} else $id=$val[0];
	$res=pg_query_params("update seminaire.agents set present=true where cd_agent=$1",array($id)) or die('Request failed: '.pg_last_error());
	pg_free_result($res);
	echo $id;
	pg_close($dbconn);
}
elseif (array_key_exists('join',$_POST)) { // Création
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("insert into seminaire.agents (nom,prenom,direction,service,unite,fonction,site,present) values ($1,$2,'DSUED',$3,$4,$5,$6,TRUE) returning cd_agent",array($_POST['name'],$_POST['fname'],$_POST['service'],$_POST['unit'],$_POST['function'],$_POST['location'])) or die('Request failed: '.pg_last_error());
	$val=pg_fetch_row($res);
	pg_free_result($res);
	if (!$val) {
		echo "KO";
		return;
	} else $id=$val[0];
	echo $id;
	pg_close($dbconn);
}
elseif (array_key_exists('pair',$_POST)) { // Retour de la paire
	$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
	$res=pg_query_params("select * from seminaire.agents where cd_agent=(select paire from seminaire.agents where cd_agent=$1)",array($_POST['pair'])) or die('Request failed: '.pg_last_error());
	$val=pg_fetch_array($res,null,PGSQL_ASSOC);
	header("Content-Type: application/json");
	echo json_encode($val);
	pg_free_result($res);
	pg_close($dbconn);
}
?>

