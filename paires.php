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
	<title>La machine à paires</title>
	<link rel="stylesheet" href="styles.css">
</head>
<body>
	<?php
		require 'login.php';
		$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
		$res=pg_query_params("select paire from seminaire.agents where id=$1",array($_COOKIE['semid'])) or die('Request failed: '.pg_last_error());
		$val=pg_fetch_row($res);
		pg_free_result($res);
		$pair=$val[0];
		if ($pair=='') {
			echo "<h1>Pas encore de paire</h1>";
		} else {
			if (strpos($pair,',')) $title="Mes paires"; else $title="Ma paire";
			echo "<h1>".$title."</h1>";
			$id=strtok($pair,',');
			while ($id!=false) {
				$res=pg_query_params("select * from seminaire.agents where id=$1",array($id)) or die('Request failed: '.pg_last_error());
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
				$id=strtok(',');
			}
		}
		pg_close($dbconn);
	?>
	<a href="home.php"><button type="button">Retour à mon profil</button></a>
</body>
</html>
