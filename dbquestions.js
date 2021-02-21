let popupopened=false;
let questions={};
let questions_index=[];
let selected_question=null;
let save_onkeydown;

/*******************************************
 *            GUI components               *
 *******************************************/
function open_popup(id,title,callback) {
	if (popupopened) return;
	save_onkeydown=window.onkeydown;
	window.onkeydown=function(event) {
		if (event.key=='Enter') close_popup(callback);
		else if (event.key=='Escape') close_popup(null);
	};
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
	if (title) popup.getElementsByTagName('h2')[0].innerHTML=title;
	popup.getElementsByTagName('input')[0].value='';
	setTimeout(function() { 
		popup.style.maxHeight='100%';
		popup.addEventListener('transitionend',function() {
			popup.querySelectorAll('button,input,select').forEach((el)=>el.disabled=false);
			popup.style.overflow='auto';
			popupopened=popup;
		},{'once':true});
		overlay.style.opacity='0.5'; }
	,50);
	popup.getElementsByClassName('btnok')[0].addEventListener('click',()=>close_popup(callback),{'once':true});
	popup.getElementsByClassName('btncancel')[0].addEventListener('click',()=>close_popup(null),{'once':true});
}

function close_popup(callback=null) {
	if (!popupopened) return;
	window.onkeydown=save_onkeydown;
	let popup=popupopened;
	popup.querySelectorAll('button,input,select').forEach((el)=>el.disabled=true);
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
	if (callback) callback(popup.getElementsByTagName('input')[0].value);
}


/*******************************************
 *              GUI actions                *
 *******************************************/
var question_sort= { "column":"", "order":0 };

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

function click_option(sender) {
	let table=document.getElementById('tanswers').children[0];
	let deselect=sender.currentTarget.classList.contains('selected');
	Array.from(table.getElementsByTagName('tr')).forEach((tr)=>tr.classList.remove('selected'));
	if (!deselect) sender.currentTarget.classList.add('selected');
}

function update_question_form() {
	let title=document.getElementById('editquestion').children[0];
	title.innerHTML=questions[selected_question].question;
	let table=document.getElementById('tanswers').children[0];
	table.innerHTML='';
	let i=0;
	for (const opt of questions[selected_question].options) {
		let tr=document.createElement('tr');
		if (i==questions[selected_question].right_answer) tr.classList.add('rightanswer');
		tr.addEventListener('click',click_option);
		let td=document.createElement('td');
		td.textContent=opt;
		tr.appendChild(td);
		table.appendChild(tr);
		++i;
	}
}

function get_selected_answer(tbody) {
	let sel=tbody.getElementsByClassName('selected');
	if (sel.length==0) return null; else return sel[0];
}

function answer_up() {
	let tbody=document.getElementById('tanswers').children[0];
	let ans=get_selected_answer(tbody);
	if (ans!=null) {
		let prev=ans.previousSibling;
		if (prev!=null) tbody.insertBefore(ans,prev);
	}
}

function answer_down() {
	let tbody=document.getElementById('tanswers').children[0];
	let ans=get_selected_answer(tbody);
	if (ans!=null) {
		let next=ans.nextSibling;
		if (next!=null) tbody.insertBefore(next,ans);
	}
}

function answer_new() {
	open_popup('textinput','Nouvelle option',function(value) {
		let tbody=document.getElementById('tanswers').children[0];
		if (value=='') return;
		let tr=document.createElement('tr');
		tr.addEventListener('click',click_option);
		let td=document.createElement('td');
		td.textContent=value;
		tr.appendChild(td);
		tbody.appendChild(tr);
	});
}

function answer_delete() {
	let tbody=document.getElementById('tanswers').children[0];
	let ans=get_selected_answer(tbody);
	if (ans!=null) ans.parentNode.removeChild(ans);
}

function answer_check() {
	let tbody=document.getElementById('tanswers').children[0];
	let ans=get_selected_answer(tbody);
	if (ans!=null) {
		Array.from(tbody.getElementsByTagName('tr')).forEach((tr)=>tr.classList.remove('rightanswer'));
		ans.classList.add('rightanswer');
	}
}

function openquestion(sender) {
	// Highlight the selected line
	let deselect=sender.currentTarget.classList.contains('selected');
	Array.from(document.getElementById('tquestions').getElementsByTagName('tr')).forEach((tr)=>tr.classList.remove('selected'));
	// Display the question
	if (deselect) {
		selected_question=null;
		document.getElementById('editquestion').classList.remove('shown');
		return;
	}
	sender.currentTarget.classList.add('selected');
	if (!selected_question) document.getElementById('editquestion').classList.add('shown');
	selected_question=sender.currentTarget.dataset['id'];
	update_question_form();
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

