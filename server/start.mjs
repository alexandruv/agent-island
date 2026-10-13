import {spawn} from 'node:child_process';
const port=Number(process.env.PORT??8080);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('PORT must be an unprivileged port');
if(!process.env.MAO_PROJECT || !process.env.MAO_REVISION)throw Error('Set MAO_PROJECT and MAO_REVISION (explicit demo values permitted locally)');
const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','0.0.0.0','--port',String(port),'--strictPort','--configLoader','runner'],{stdio:'inherit',env:process.env});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));
