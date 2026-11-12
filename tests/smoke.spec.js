const {test,expect}=require('@playwright/test');
const screens=['inicio','clientes','avaliacoes','exercicios','planos','agenda','sessoes','relatorios','pagamentos','config','dados'];
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{localStorage.removeItem('gymbody-data-v1');localStorage.removeItem('gymbody-theme-v1')});
});
test('app starts and core screens render without uncaught errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.locator('#app')).not.toBeEmpty();
 for(const name of screens){
  await page.evaluate(v=>{view=v;render()},name);
  await expect(page.locator('#app')).not.toBeEmpty();
  await expect(page.locator('#app')).not.toContainText('undefinedundefined');
 }
 expect(errors).toEqual([]);
});
test('theme switching preserves readable exercise details',async({page},testInfo)=>{
 await page.goto('/');
 for(const theme of ['light','dark','auto']){
  await page.evaluate(mode=>{
   localStorage.setItem('gymbody-theme-v1',mode);
   document.documentElement.dataset.gymTheme=mode==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode;
   view='exercicios';render();
  },theme);
  const active=await page.locator('html').getAttribute('data-gym-theme');
  expect(['light','dark']).toContain(active);
  const card=page.locator('.exercise-card').first();
  if(await card.count()){
   await card.click();
   const modal=page.locator('.exercise-detail').first();
   await expect(modal).toBeVisible();
   const contrast=await modal.evaluate(el=>{
    function rgb(s){const v=s.match(/[\d.]+/g);return v? v.slice(0,3).map(Number):null}
    function lum(c){const a=c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722}
    const bg=rgb(getComputedStyle(el).backgroundColor),head=el.querySelector('h2'),fg=head?rgb(getComputedStyle(head).color):null;
    return bg&&fg?(Math.max(lum(bg),lum(fg))+.05)/(Math.min(lum(bg),lum(fg))+.05):0
   });
   expect(contrast).toBeGreaterThanOrEqual(4.5);
   await page.screenshot({path:testInfo.outputPath('atlas-'+theme+'.png'),fullPage:false});
   await page.keyboard.press('Escape');
   await page.evaluate(()=>document.querySelector('.exercise-modal')?.remove());
  }
 }
});
test('dashboard and payments survive a reload with local-only data',async({page})=>{
 await page.goto('/');
 await page.evaluate(()=>{
  db.clientes.push({id:'test-client-1',nome:'Cliente Teste'});
  db.pagamentos=db.pagamentos||{};
  db.pagamentos['test-client-1|2026|11']=true;
  save();view='pagamentos';render();
 });
 await expect(page.locator('#app')).toContainText('Cliente Teste');
 await page.reload();
 await page.evaluate(()=>{view='pagamentos';render()});
 await expect(page.locator('#app')).toContainText('Cliente Teste');
 expect(await page.evaluate(()=>db.pagamentos['test-client-1|2026|11'])).toBe(true);
});
