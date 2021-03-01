let popupopened=false;
let quizz={};
let questions=null;
let questions_index=[];
let selected_question=null;
let save_onkeydown;

/*******************************************
 *          Utility functions              *
 *******************************************/
function encode_psql_string(s) {
	return '"'+String(s).replace('\\','\\\\').replace('"','\\"')+'"';
}

/*******************************************
 *           Popup management              *
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
	if (title) popup.getElementsByTagName('h2')[0].innerHTML=title;
	popup.getElementsByTagName('input')[0].value='';
	setTimeout(function() { 
		popup.style.maxHeight='100%';
		popup.addEventListener('transitionend',function() {
			popup.querySelectorAll('button,input,select').forEach((el)=>el.disabled=false);
			popup.style.overflow='auto';
			let tfield=popup.getElementsByTagName('input')[0];
			if (tfield) {
				tfield.focus();
				tfield.select();
			}
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
	overlay.addEventListener('transitionend',() => overlay.style.display='none',{'once':true});
	popup.addEventListener('transitionend',() => popup.style.display='none',{'once':true});
	overlay.style.opacity='0';
	popup.style.overflow='hidden';
	popup.style.maxHeight='0px';
	popupopened=null;
	if (callback) callback(popup.getElementsByTagName('input')[0].value);
}

/*******************************************
 *            Question editor              *
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
	const qu=questions[selected_question];
	for (const opt of qu.options) {
		let tr=document.createElement('tr');
		if (i==qu.right_answer) tr.classList.add('rightanswer');
		tr.addEventListener('click',click_option);
		let td=document.createElement('td');
		td.textContent=opt;
		tr.appendChild(td);
		table.appendChild(tr);
		++i;
	}
	if (qu.explain) {
		document.getElementById('explaintext').value=qu.explain.text;
		document.getElementById('explainlink').value=qu.explain.link;
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
		if (value=='' | tbody.children.length>=6) return;
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

function save_options() {
	if (selected_question==null) return;
	let tbody=document.getElementById('tanswers').children[0];
	let qu=questions[selected_question];
	qu.options=[];
	qu.right_answer=null;
	if (!qu.explain) qu.explain={'text':'','link':''};
	qu.explain.text=document.getElementById('explaintext').value;
	qu.explain.link=document.getElementById('explainlink').value;
	let i=0;
	Array.from(tbody.getElementsByTagName('tr')).forEach(function(tr) {
		qu.options.push(tr.children[0].textContent);
		if (tr.classList.contains('rightanswer')) qu.right_answer=i;
		++i;
	});
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=function() {
		if (!this.responseText.startsWith('OK')) return;
		create_questions_table();
		close_options();
	}
	let query='update-question='+selected_question;
	if (qu.right_answer!=null) query+='&rightanswer='+qu.right_answer;
	if (qu.explain.text!='') query+='&explaintext='+encodeURIComponent(qu.explain.text);
	if (qu.explain.link!='') query+='&explainlink='+encodeURIComponent(qu.explain.link);
	let qanswers='{'+qu.options.map(encode_psql_string).join(',')+'}';
	query+="&answers="+encodeURIComponent(qanswers);
	xhttp.send(query);
}

function close_options() {
	Array.from(document.getElementById('tquestions').getElementsByTagName('tr')).forEach((tr)=>tr.classList.remove('selected'));
	selected_question=null;
	document.getElementById('editquestion').classList.remove('shown');
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

function create_question_row(questionid) {
	let tr=document.createElement('tr');
	tr.addEventListener('click',openquestion);
	tr.dataset['id']=questionid;
	let tdd=document.createElement('td');
	tdd.innerHTML='<button type="button" class="small" onclick="question_update(event)"><img src="edit.svg" /></button><button type="button" class="small" onclick="question_delete(event)"><img src="remove.svg" /></button>';
	tr.appendChild(tdd);
	for (const [col,descr] of Object.entries(question_fields)) {
		let td=document.createElement('td');
		if (descr.classlist) for (const a of descr.classlist) td.classList.add(a);
		td.innerText=questions[questionid][col];
		tr.appendChild(td);
	}
	return tr;
}

function question_new() {
	open_popup('textinput','Nouvelle question',function(value) {
		if (value=='') return;
		let xhttp=new XMLHttpRequest();
		xhttp.open('POST','quizz.php',true);
		xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		xhttp.onload=function() {
			const id=this.responseText;
			questions[id]={'question':value,'options':[]};
			let tbody=document.getElementById('tquestions').getElementsByTagName('tbody')[0];
			questions_index.push(id);
			tbody.appendChild(create_question_row(id));
		}
		xhttp.send('add-question='+game+'&question='+encodeURIComponent(value)+"&answers={}");
	});
}

function question_delete(event) {
	event.stopPropagation();
	let tr=event.target.closest('tr');
	let id=tr.dataset['id'];
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=function() {
		if (!this.responseText.startsWith('OK')) return;
		delete questions[id];
		let indexid=questions_index.findIndex((el)=>el==id);
		questions_index.splice(indexid,1);
		tr.parentNode.removeChild(tr);
	}
	xhttp.send('delete-question='+id);
}

function question_update(event) {
	event.stopPropagation();
	open_popup('textinput','Modifier la question',function(value) {
		let tr=event.target.closest('tr');
		let id=tr.dataset['id'];
		let xhttp=new XMLHttpRequest();
		xhttp.open('POST','quizz.php',true);
		xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		xhttp.onload=function() {
			if (!this.responseText.startsWith('OK')) return;
			questions[id].question=value;
			tr.getElementsByTagName('td')[1].textContent=value;
		}
		xhttp.send('update-question='+id+'&question='+decodeURIComponent(value));
	});
}

function create_questions_table() {
	if (questions_index.length==0) for (const [id,qu] of Object.entries(questions)) if (qu.cd_game==game) questions_index.push(id);
	let tab=document.getElementById('tquestions');
	tab.innerHTML='';
	let head=document.createElement('thead');
	let tr=document.createElement('tr');
	let tha=document.createElement('th');
	tha.classList.add('tools');
	tha.innerHTML='<button class="small" type="button" title="Ajouter" onclick="question_new()"><img src="add.svg" /></button>';
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
	for (const question of questions_index) body.appendChild(create_question_row(question));
}

/*******************************************
 *              Game editor                *
 *******************************************/
function selection_to() {
	let sel=document.getElementById('avquestions').querySelectorAll('tr.selected')[0];
	if (sel!=null) {
		document.getElementById('selquestions').children[0].appendChild(sel);
		sel.scrollIntoView();
	}
}

function selection_from() {
	let sel=document.getElementById('selquestions').querySelectorAll('tr.selected')[0];
	if (sel!=null) {
		document.getElementById('avquestions').children[0].appendChild(sel);
		sel.scrollIntoView();
	}
}

function selection_up() {
	let tbody=document.getElementById('selquestions').children[0];
	let sel=tbody.querySelectorAll('tr.selected')[0];
	if (sel!=null) {
		let prev=sel.previousSibling;
		if (prev!=null) tbody.insertBefore(sel,prev);
		sel.scrollIntoView();
	}
}

function selection_down() {
	let tbody=document.getElementById('selquestions').children[0];
	let sel=tbody.querySelectorAll('tr.selected')[0];
	if (sel!=null) {
		let next=sel.nextSibling;
		if (next!=null) tbody.insertBefore(next,sel);
		sel.scrollIntoView();
	}
}

function selection_toggle(event) {
	Array.from(event.currentTarget.closest('div.seltables').getElementsByTagName('tr')).forEach((el)=>{if (el!=event.currentTarget) el.classList.remove('selected')});
	event.currentTarget.classList.toggle('selected');
}

function game_update() {
	let baseuri=window.location.protocol+'//'+window.location.hostname;
	if (location.port!='') baseuri+=':'+location.port;
	baseuri+=window.location.pathname.replace(/(.*)\/[^/]*$/,'$1/');
	document.getElementById('quizzurl').value=baseuri+'quizz.htm?game='+game;
	document.getElementById('playerurl').value=baseuri+'qpc.htm?game='+quizz.pkey;
	document.getElementById('adminurl').value=baseuri+'dbquestions.htm?game='+game;
	document.getElementById('quizzname').value=quizz.name;
	let tbody=document.getElementById('avquestions').children[0];
	tbody.innerHTML='';
	let tsbody=document.getElementById('selquestions').children[0];
	tsbody.innerHTML='';
	for (const [key,qu] of Object.entries(questions)) if (!quizz.setquestions.includes(parseInt(key))) {
		let tr=document.createElement('tr');
		tr.dataset['id']=key;
		tr.addEventListener('click',selection_toggle);
		let td=document.createElement('td');
		td.textContent=qu.question;
		tr.appendChild(td);
		tbody.appendChild(tr);
	}
	for (const key of quizz.setquestions) {
		let tr=document.createElement('tr');
		tr.dataset['id']=key;
		tr.addEventListener('click',selection_toggle);
		let td=document.createElement('td');
		td.textContent=questions[key].question;
		tr.appendChild(td);
		tsbody.appendChild(tr);
	}
}

function game_register() {
	quizz.name=document.getElementById('quizzname').value;
	quizz.setquestions=[];
	Array.from(document.getElementById('selquestions').querySelectorAll('tr')).forEach((tr)=>quizz.setquestions.push(tr.dataset['id']));
}

function game_save(event) {
	let btn=event.currentTarget;
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=function() {
		if (!this.responseText.startsWith('OK')) return;
		btn.classList.add('validated');
		btn.disabled=true;
		setTimeout(()=>{btn.classList.remove('validated');btn.disabled=false;},2000);
	}
	game_register();
	xhttp.send('update-game='+game+'&name='+encodeURIComponent(quizz.name)+'&questions='+encodeURIComponent('{'+quizz.setquestions.join(',')+'}'));
}

/*******************************************
 *          General GUI functions          *
 *******************************************/
function to_section(froms,tos,fromright) {
	let currentsection=document.getElementById(froms);
	let newsection=document.getElementById(tos);
	newsection.style.left=fromright?'100vw':'-100vw';
	newsection.style.visibility='visible';
	newsection.style.transition='left 1s ease-in-out';
	currentsection.style.transition='left 1s ease-in-out';
	newsection.addEventListener('transitionend',function() {
		newsection.style.transition='unset';
		currentsection.style.transition='unset';
		currentsection.visibility='hidden';
	},{'once':true});
	setTimeout(function() {
		newsection.style.left='0vw';
		currentsection.style.left=fromright?'-100vw':'100vw';
	},50);
}

document.addEventListener("DOMContentLoaded",function() {
	// Get game UUID from query string
	let querys=decodeURI(location.search.substr(1)).split('&');
	let parameters=[];
	for (let i=0;i<querys.length;++i) {
		let varval=querys[i].split('=');
		parameters[varval[0]]=varval[1];
	}
	game='1';
	if ('game' in parameters && parameters['game']!='') game=parameters['game'];
	// Load questions
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=function() {
		quizz=JSON.parse(this.responseText);
		questions=quizz['questions'];
		game_update();
		create_questions_table();
	}
	xhttp.send('get-questions='+game);
});

