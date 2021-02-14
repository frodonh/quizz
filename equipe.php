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
	<?php
		const colors=["var(--palettea)","var(--paletteb)","var(--palettec)","var(--paletted)","var(--palettee)","var(--palettef)"];
		const ncolors=["Bleus","Verts","Fuchsia","Orange","Gris"];
		require 'login.php';
		$dbconn=pg_connect("host=".$host." dbname=".$dbname." user=".$user." password=".$password) or die ('Impossible to connect to the database: '.pg_last_error());
		$res=pg_query_params("select * from seminaire.agents where cd_agent=$1",array($_COOKIE['semid'])) or die('Request failed: '.pg_last_error());
		$val=pg_fetch_array($res,null,PGSQL_ASSOC);
		pg_free_result($res);
		$res=pg_query_params("select nom,prenom,direction,service,unite,fonction,site from seminaire.agents where equipe=(select equipe from seminaire.agents where cd_agent=$1) and present=true order by nom",array($_COOKIE['semid'])) or die('Request failed: '.pg_last_error());
		$arr=pg_fetch_all($res);
		pg_close($dbconn);
		echo '<h1 class="fg-equipe'.$val['equipe'].'">Les '.ncolors[$val['equipe']]."</h1>";
		echo '<table class="equipe equipe'.$val['equipe'].'">';
		echo '<thead><tr><th>Nom</th><th>Prénom</th><th>Direction</th><th>Service</th><th>Unité</th><th>Fonction</th></tr></thead>';
		echo '<tbody>';
		foreach ($arr as $row) {
			echo "<tr><td>".$row['nom']."</td><td>".$row["prenom"]."</td><td>".$row["direction"]."</td><td>".$row["service"]."</td><td>".$row["unite"]."</td><td>".$row["fonction"]."</td></tr>";
		}
		echo "</tbody></table>";
	?>
	<a href="home.php"><button type="button">Retour à mon profil</button></a>
</body>
<script>
</script>
</html>

