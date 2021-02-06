var questions;
var currentstatus=null;
var agentid;
var timerid=null;
var answered=[];
var xDown=null,xUp=null,yDown=null,yUp=null;

/**********************************
 *       General functions        *
 **********************************/
function to_waiting_page() {
	if (currentstatus==-1) return;
	const questiondiv=document.getElementById('question');
	const optionsdiv=document.getElementById('options');
	questiondiv.innerHTML='Merci de patienter pour la question suivante';
	optionsdiv.innerHTML='<embed src="waiting.svg" style="width: 40vw" />';
	if (timerid) clearInterval(timerid);
	timerid=setInterval(to_current_state,10000);
	currentstatus=-1;
}

function to_current_state() {
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=function() {
		let current=parseInt(this.responseText);
		if (isNaN(current) || answered[current]!=null) to_waiting_page(); else display(current);
	}
	xhttp.send('action=current');
}

function handle_answer_click(event) {
	let id=document.getElementById('question').dataset['question'];
	let ans=event.currentTarget.dataset['option'];
	answered[id]=ans;
	let xhttp=new XMLHttpRequest();
	xhttp.open('POST','quizz.php',true);
	xhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xhttp.onload=to_waiting_page;
	xhttp.send('agent='+agentid+'&question='+id+'&answer='+ans);
}

function display(id) {
	if (currentstatus==id) return;
	const questiondiv=document.getElementById('question');
	const optionsdiv=document.getElementById('options');
	questiondiv.innerHTML=questions[id]['question'];
	questiondiv.dataset['question']=''+id;
	optionsdiv.innerHTML='';
	for (let i=0;i<questions[id]['options'].length;++i) {
		let div=document.createElement('div');
		div.classList.add('option');
		div.dataset['option']=''+i;
		let innerdiv=document.createElement('div');
		innerdiv.innerHTML=questions[id]['options'][i];
		div.appendChild(innerdiv);
		div.addEventListener('click',handle_answer_click);
		optionsdiv.appendChild(div);
	}
	if (timerid) clearInterval(timerid);
	timerid=setInterval(to_current_state,30000);
	currentstatus=id;
}
/**********************************
 *        Swipe handling          *
 **********************************/
function getTouches(evt) {
	return evt.touches || evt.originalEvent.touches;
}

/**
 * Function called when the user initiates a swipe movement.
 * @param {object} evt - Event object
 */
function handleTouchStart(evt) {
	xDown=getTouches(evt)[0].clientX;
	yDown=getTouches(evt)[0].clientY;
}

/**
 * Function called when the user is moving his finger in a swipe movement.
 * @param {object} evt - Event object
 */
function handleTouchMove(evt) {
	xUp=getTouches(evt)[0].clientX;
	yUp=getTouches(evt)[0].clientY;
}

/**
 * Function called when the user releases the screen in a swipe movement.
 * @param {object} evt - Event object
 */
function handleTouchEnd(evt) {
	if (xDown==null || yDown==null || xUp==null || yUp==null) return;
	if (Math.abs(xUp-xDown)>Math.abs(yUp-yDown)) {
		if (Math.abs(xUp-xDown)>200) {
			if (xUp<xDown) to_current_state();
		}
	} 
}

/**********************************
 *       Main event loop          *
 **********************************/
document.addEventListener("DOMContentLoaded",function(event) {
	let xhttp=new XMLHttpRequest();
	xhttp.open('GET','quizz.php',true);
	xhttp.onreadystatechange=function() {
		if (this.readyState==XMLHttpRequest.DONE && this.status==200) {
			questions=JSON.parse(this.responseText);
			to_current_state();
		}
	}
	xhttp.send();
	// Get agent id from cookie
	const cookies=document.cookie;
	const pos=cookies.indexOf('semid=')+6;
	const endpos=cookies.indexOf(';',pos);
	if (endpos==-1) agentid=cookies.substring(pos);
	else agentid=cookies.substring(pos,endpos); 
	// Handle swipe events
	document.addEventListener('touchstart',handleTouchStart,false);
	document.addEventListener('touchmove',handleTouchMove,false);
	document.addEventListener('touchend',handleTouchEnd,false);
	// Handle keyboard events
	document.addEventListener('keydown',function(e) {
		switch (e.keyCode) {
			case 39:case 32:	// Right arrow, Space
				to_current_state();
				break;
		}
	});
});
