const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.addInitScript(()=>{localStorage.removeItem('gymbody-data-v1');localStorage.removeItem('gymbody-theme-v1')})});
test('client creation through the interface persists after reload',async({page})=>{
 await page.goto('/');
 await page.locator('[data-view="clientes"]').first().click();
 const form=page.locator('#cliente');
 await form.locator('[name="numero"]').fill('TEST-001');
 await form.locator('[name="nome"]').fill('Cliente Fictício');
 await form.locator('button').last().click();
 await expect(page.locator('#app')).toContainText('Cliente Fictício');
 await page.reload();
 await page.locator('[data-view="clientes"]').first().click();
 await expect(page.locator('#app')).toContainText('Cliente Fictício');
});
test('invalid JSON import does not replace existing records',async({page})=>{
 await page.goto('/');
 await page.evaluate(()=>{db.clientes.push({id:'fixture',numero:'001',nome:'Cliente Fictício'});save();view='dados';render()});
 await page.locator('#import').setInputFiles({name:'invalido.json',mimeType:'application/json',buffer:Buffer.from('{"version":2,"data":{"clientes":[],"exercicios":[],"planos":[],"registos":[{"nome":"Sem ID"}]}}')});
 const dialog=await page.waitForEvent('dialog');await dialog.dismiss();
 expect(await page.evaluate(()=>db.clientes.some(x=>x.id==='fixture'))).toBe(true);
});
test('import cancellation preserves records',async({page})=>{
 await page.goto('/');
 await page.evaluate(()=>{db.clientes.push({id:'fixture',numero:'001',nome:'Cliente Fictício'});save();view='dados';render()});
 page.once('dialog',d=>d.dismiss());
 await page.locator('#import').setInputFiles({name:'copia.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:2,data:{clientes:[],exercicios:[],planos:[],registos:[],avaliacoes:[]}}))});
 await expect.poll(()=>page.evaluate(()=>db.clientes.length)).toBe(1);
});
