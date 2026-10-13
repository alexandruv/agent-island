// Renderer availability is authoritative, including context loss after startup.
export function bindViewControl(root: Pick<HTMLElement,'classList'>, button: Pick<HTMLButtonElement,'disabled'|'textContent'|'addEventListener'>){
 let available=false;
 function sync(){
  if(!available)root.classList.add('lane-only');
  button.disabled=!available;
  button.textContent=!available?'Lane view only':root.classList.contains('lane-only')?'Use island view':'Use lane view';
 }
 button.addEventListener('click',()=>{if(available)root.classList.toggle('lane-only');sync();});
 sync();
 return {setAvailable(value:boolean){available=value;if(value)root.classList.remove('lane-only');sync();}};
}
