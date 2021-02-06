var agents=[];

function closeautocomplete(el) {
	let x=document.getElementsByClassName("autocomplete-items");
	for (let i=0;i<x.length;i++) {
		if (el!=x[i]) x[i].parentNode.removeChild(x[i]);
	}
}

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
	xhttp.send("register="+encodeURIComponent(document.getElementById('ident').value));
}

document.addEventListener("DOMContentLoaded",function(event) {
	// Auto-complete
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST',"agents.php");
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=function(){
		agents=JSON.parse(xhttp.responseText);
	}
	xhttp.send("action=list");
	document.addEventListener("click",function(e) {closeautocomplete(e.target);});
	let inp=document.getElementById("ident");
	inp.addEventListener("keydown",function(e) {
		if (e.keyCode==13) {
			e.preventDefault();
			closeautocomplete();
		}
	});
	inp.addEventListener("input",function(e) {
		let val=this.value;
		closeautocomplete();
		if (!val) return false;
		val=val.toUpperCase();
		let div=document.createElement("div");
		div.classList.add('autocomplete-items');
		inp.parentNode.appendChild(div);
		let num=0;
		for (const agent of agents) {
			if (num==10) break;
			if (agent[1].toUpperCase().includes(val) || agent[2].toUpperCase().includes(val)) {
				num++;
				let divb=document.createElement("div");
				divb.dataset["id"]=agent[0];
				divb.innerHTML=agent[1]+" "+agent[2];
				divb.addEventListener("click",function(e) {
					inp.value=this.innerText;
					closeautocomplete();
				});
				div.appendChild(divb);
			}
		}
	});
	// Submit form
	document.getElementById("ok").addEventListener("click",submit);
	document.getElementById("register").addEventListener("click",()=>{window.location.href="register.htm";});
});
