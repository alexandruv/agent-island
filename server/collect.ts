import {writeFile,rename} from 'node:fs/promises';
import {Collector,boundedFile,type CollectorConfig} from './collector';
async function main() {
const path=process.argv[2];
if(!path)throw Error('Usage: npm run collect -- /absolute/operator-config.json');
const config=await boundedFile(path) as CollectorConfig & {outputFile:string;intervalMs:number};
if(!config.outputFile?.startsWith('/') || !Number.isInteger(config.intervalMs)||config.intervalMs<10000||config.intervalMs>300000)throw Error('Invalid output or polling interval');
const collector=new Collector(config);
let stopped=false;
process.once('SIGINT',()=>{stopped=true;});process.once('SIGTERM',()=>{stopped=true;});
while(!stopped){
 const snapshot=await collector.collect();
 const temporary=`${config.outputFile}.tmp-${process.pid}`;
 await writeFile(temporary,JSON.stringify(snapshot),{mode:0o600,flag:'wx'});await rename(temporary,config.outputFile);
 // Only one current snapshot is retained; no raw output or errors are logged.
 await new Promise(resolve=>setTimeout(resolve,config.intervalMs));
}

}
void main().catch(()=>{console.error("Collector failed; check operator configuration and export access.");process.exitCode=1;});
