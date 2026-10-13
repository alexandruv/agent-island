// Renderer availability is authoritative, including context loss after startup.
export function bindViewControl(root: Pick<HTMLElement,'classList'>, button: Pick<HTMLButtonElement,'disabled'|'textContent'|'addEventListener'>){
 let available=false;
 function sync(){
  if(!available){root.classList.add('lane-only');root.classList.remove('details-open');}
  button.disabled=!available;
  (button as HTMLButtonElement).setAttribute?.('aria-expanded',String(root.classList.contains('details-open')));
  button.textContent=!available?'Lane view only':root.classList.contains('details-open')?'Close lane view':'Lane view';
 }
 button.addEventListener('click',()=>{if(available)root.classList.toggle('details-open');sync();});
 sync();
 return {openDetails(){if(available)root.classList.add('details-open');sync();},setAvailable(value:boolean){available=value;if(value)root.classList.remove('lane-only');sync();}};
}
