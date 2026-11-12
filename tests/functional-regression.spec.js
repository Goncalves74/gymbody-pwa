const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{
  if(!sessionStorage.getItem('gymbody-regression-started')){
   localStorage.removeItem('gymbody-data-v1');
   localStorage.removeItem('gymbody-theme-v1');
   sessionStorage.setItem('gymbody-regression-started','1');
  }
 });
});
async function navigate(page,name){
 // A barra inferior só apresenta alguns destinos; os restantes são atalhos do início.
 const home=page.locator('#nav [data-view="inicio"]:visible');
 if(name==='inicio'){
  await home.click();
 }else{
  await home.click();
  const shortcut=page.locator('#app button.feature[data-go="'+name+'"]');
  await expect(shortcut).toBeVisible();
  await shortcut.click();
 }
 await expect.poll(()=>page.evaluate(()=>view)).toBe(name);
 await expect(page.locator('#app')).not.toBeEmpty();
}
test('real navigation visits core views without JavaScript exceptions',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 for(const view of ['clientes','avaliacoes','exercicios','planos','agenda','sessoes','relatorios','pagamentos','config','dados','inicio']){
  await navigate(page,view);
 }
 expect(errors).toEqual([]);
});
test('client form validates required fields and persists a valid client',async({page})=>{
 await page.goto('/');await navigate(page,'clientes');
 const form=page.locator('#cliente');
 await form.locator('[name="numero"]').fill('QA-101');
 await form.locator('button').last().click();
 expect(await form.locator('[name="nome"]').evaluate(el=>el.validity.valid)).toBe(false);
 expect(await page.evaluate(()=>db.clientes.some(c=>c.numero==='QA-101'))).toBe(false);
 await form.locator('[name="numero"]').fill('QA-101');
 await form.locator('[name="nome"]').fill('Cliente de Teste');
 await form.locator('button').last().click();
 await expect(page.locator('#app')).toContainText('Cliente de Teste');
 await page.reload();await navigate(page,'clientes');
 await expect(page.locator('#app')).toContainText('Cliente de Teste');
});
test('export creates a JSON backup containing existing clients',async({page})=>{
 await page.goto('/');await navigate(page,'clientes');
 await page.locator('#cliente [name="numero"]').fill('QA-102');
 await page.locator('#cliente [name="nome"]').fill('Cliente Backup');
 await page.locator('#cliente button').last().click();
 await navigate(page,'dados');
 const downloadPromise=page.waitForEvent('download');
 await page.locator('#export').click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toMatch(/^gymbody-backup-.*\.json$/);
 const fs=require('fs');
 const raw=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
 expect(raw.version).toBe(2);
 expect(raw.data.clientes.some(c=>c.nome==='Cliente Backup')).toBe(true);
});
