const unites={
	"ECUMM":["","Marha"],
	"SOAD":["","uDAM","Synobs","OSIR"],
	"SEMA":[""],
	"Patrinat":["","Données AMO","Applications informatiques","Administration et communication","Vigie-Nature","CITES","Centre de données","Evaluation et suivi","Rapportages et valorisation","Espaces et partenariats","Directives milieu marin","Connaissance des espèces","Ecosystèmes et réseaux"]
};

function submit(event) {
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST',"agents.php");
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=function(){
		let res=xhttp.responseText;
		if (!isNaN(res)) {
			let id=parseInt(res);
			let d=new Date();
			d.setTime(d.getTime()+2*24*3600*1000);
			document.cookie="semid="+id+"; expires="+d.toUTCString()+"; path=/";
			window.location.href="home.php";
		} else if (res.startsWith("KO")) {
			event.target.parentNode.getElementsByTagName('p')[0].style.display="block";
		}
	}
	xhttp.send("join=1&name="+encodeURIComponent(document.getElementById('name').value)+"&fname="+encodeURIComponent(document.getElementById('fname').value)+"&service="+encodeURIComponent(document.getElementById('service').value)+"&unit="+encodeURIComponent(document.getElementById('unit').value)+"&function="+encodeURIComponent(document.getElementById('function').value)+"&location="+encodeURIComponent(document.getElementById('location').value));
}

document.addEventListener("DOMContentLoaded",function() {
	// Submit form
	document.getElementById("ok").addEventListener("click",submit);
});

