let popupopened=false;
let questions={};
let questions_index=[];

/*******************************************
 *            GUI components               *
 *******************************************/
function open_popup(id,onkeydown=null) {
	if (popupopened) return;
	let overlay=document.getElementById('overlay');
	overlay.style.opacity='0';
	overlay.style.display='block';
	let popup=document.getElementById(id);
	popup.style.maxHeight='0px';
	popup.style.display='block';
	popup.style.overflow='hidden'; 
	let tfield=popup.getElementsByTagName('input')[0];
	if (tfield) {
		tfield.focus();
		tfield.select();
	}
	setTimeout(function() { 
		popup.style.maxHeight='100%';
		popup.addEventListener('transitionend',function() {
			popup.querySelectorAll('button,input,select').forEach((el)=>el.disabled=false);
			popup.style.overflow='auto';
			save_onkeydown=window.onkeydown;
			if (onkeydown) window.onkeydown=onkeydown;
			else if (id in hotkeys) {
				window.onkeydown=function(event) {
					if (event.keyCode in hotkeys[id]) hotkeys[id][event.keyCode]();
				};
			} else window.onkeydown=null;
			popupopened=popup;
		},{'once':true});
		overlay.style.opacity='0.5'; }
	,50);
}

function close_popup(callback=null) {
	if (!popupopened) return;
	let popup=popupopened;
	popup.querySelectorAll('button,input,select').forEach((el)=>el.disabled=true);
	window.onkeydown=save_onkeydown;
	let overlay=document.getElementById('overlay');
	if (callback) {
		overlay.style.display='none';
		popup.style.display='none';
	} else {
		overlay.addEventListener('transitionend',() => overlay.style.display='none',{'once':true});
		popup.addEventListener('transitionend',() => popup.style.display='none',{'once':true});
	}
	overlay.style.opacity='0';
	popup.style.overflow='hidden';
	popup.style.maxHeight='0px';
	popupopened=null;
	if (callback) callback();
}


/*******************************************
 *              GUI actions                *
 *******************************************/
var question_sort= {
	"column":"",
	"order":0
};

const question_fields = {
	"question":{
		title:"Question",
		sort_method:(a)=>a.toUpperCase()
	}
};

function sort_column(event) {
	const f=event.target.dataset['field'];
	if (question_sort.column==f) {
		question_sort.order+=1;
		if (question_sort.order==2) question_sort.order=-1;
	} else {
		question_sort={ "column":f, "order":1 };
	}
	questions_index.sort(function(a,b) {
		const sa=('sort_method' in question_fields[f])?question_fields[f].sort_method(questions[a][f]):questions[a][f];
		const sb=('sort_method' in question_fields[f])?question_fields[f].sort_method(questions[b][f]):questions[b][f];
		if (sa==sb) return 0;
		return (sa<sb)?-question_sort.order:question_sort.order;
	});
	create_questions_table();
}

function newquestion(sender) {
}

function openquestion(sender) {
	// Highlight the selected line
	
	// Display the question
}

function create_questions_table() {
	if (questions_index.length==0) for (const id of Object.keys(questions)) questions_index.push(id);
	let tab=document.getElementById('tquestions');
	tab.innerHTML='';
	let head=document.createElement('thead');
	let tr=document.createElement('tr');
	let tha=document.createElement('th');
	tha.classList.add('tools');
	tha.innerHTML='<button class="small" type="button" title="Ajouter" onclick="newquestion(this)"><img src="add.svg" /></button>';
	tr.appendChild(tha);
	for (const [col,descr] of Object.entries(question_fields)) {
		let th=document.createElement('th');
		if (descr.classlist) for (const a of descr.classlist) th.classList.add(a);
		let link=document.createElement('a');
		link.addEventListener('click',sort_column);
		if (question_sort.column==col && question_sort.order!=0) link.classList.add(question_sort.order==1?'sorted':'sorted-reverse');
		link.dataset['field']=col;
		link.textContent=descr.title;
		th.appendChild(link);
		tr.appendChild(th);
	}
	head.appendChild(tr);
	tab.appendChild(head);
	let body=document.createElement('tbody');
	tab.appendChild(body);
	for (const question of questions_index) {
	let tr=document.createElement('tr');
		tr.addEventListener('click',openquestion);
		tr.dataset['id']=question;
		tr.appendChild(document.createElement('td'));
		for (const [col,descr] of Object.entries(question_fields)) {
			let td=document.createElement('td');
			if (descr.classlist) for (const a of descr.classlist) td.classList.add(a);
			td.innerText=questions[question][col];
			tr.appendChild(td);
		}
		body.appendChild(tr);
	}
}

document.addEventListener("DOMContentLoaded",function() {
	// Add responsive dropdown button for menu bars, to give access to options hidden when the screen is not wide enough
	document.querySelectorAll('section>header>nav>ul').forEach(function(el) {
		let btn=document.createElement('button');
		btn.onclick=()=>el.parentNode.classList.toggle('open');
		Array.from(el.getElementsByTagName('li')).forEach(function(li) {
			li.addEventListener('click',()=>el.parentNode.classList.toggle('open'));
		});
		el.insertBefore(btn,el.firstChild);
	});
	// Load questions
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=function() {
		questions=JSON.parse(this.responseText);
		create_questions_table();
	}
	xhttp.send('get_quizz=0');
});

