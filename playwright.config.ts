import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/ui',
 use:{baseURL:'http://127.0.0.1:18081',browserName:'chromium',headless:true,launchOptions:{args:['--use-gl=swiftshader']}},
 webServer:{command:'npm run build && npm run preview -- --port 18081',url:'http://127.0.0.1:18081',reuseExistingServer:false},
 reporter:'list',
});
