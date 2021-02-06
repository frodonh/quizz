<?php
	if (!array_key_exists('semid',$_COOKIE)) {
		header('Location: login.htm',TRUE,302);
		exit();
	}
?>
<!DOCTYPE html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Séminaire DSUED</title>
	<link rel="stylesheet" href="styles.css">
</head>
<body>
	<h1>Mon profil</h1>
	<?php
		require 'login.php';
		$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
		$res=pg_query_params("select * from seminaire.agents where id=$1",array($_COOKIE['semid'])) or die('Request failed: '.pg_last_error());
		$val=pg_fetch_array($res,null,PGSQL_ASSOC);
		pg_free_result($res);
		echo "<div class=\"fiche equipe{$val['equipe']} expanded\"><div class=\"button\" onclick=\"this.parentNode.classList.toggle('expanded')\"><a href=\"#\"></a></div><h1>{$val['prenom']} {$val['nom']}</h1>";
		echo "<p class=\"service\">{$val['direction']}";
		if ($val['service']!='') echo '/'.$val['service'];
		if ($val['unite']!='') echo '/'.$val['unite'];
		echo "</p>";
		echo "<p class=\"fonction\">{$val['fonction']}</p>";
		echo "<p class=\"site\">{$val['site']}</p>";
		echo '</div>';
		pg_close($dbconn);
	?>
	<a href="paires.php"><button type="button">Découvrir ma paire</button></a>
	<a href="equipe.php"><button type="button">Voir mon équipe</button></a>
	<a href="qpc.htm"><button type="button">Participer au quizz</button></a>
	<a href="login.htm"><button type="button" onclick="document.cookie='semid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; return true">Déconnexion</button></a>
</body>
</html>
