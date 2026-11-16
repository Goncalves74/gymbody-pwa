const {test,expect}=require('@playwright/test');

test('plan hub routes to all three working areas',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.evaluate(()=>{view='planos';render()});
 await expect(page.locator('.plan-hub-options [data-plan-nav]')).toHaveCount(3);
 await page.locator('[data-plan-nav="choose"]').click();
 await expect(page.locator('[data-plan-kind]')).toHaveCount(3);
 await page.locator('[data-plan-kind="generic"]').click();
 await expect(page.locator('#genericSave')).toBeVisible();
 await expect(page.locator('#datedSave')).toHaveCount(0);
 await page.locator('[data-plan-home]').click();
 await page.locator('[data-plan-nav="history"]').click();
 await expect(page.locator('#datedHistoryClient')).toBeVisible();
 await page.locator('[data-plan-home]').click();
 await page.locator('[data-plan-nav="share"]').click();
 await expect(page.locator('#datedShareClient')).toBeVisible();
 expect(errors).toEqual([]);
});

test('dated plan is reviewed and its edited sets are saved before sharing',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.evaluate(()=>{
  db.clientes.push({id:'c1',nome:'Cliente Teste',numero:'1'});
  db.exercicios.push({id:'e1',nome:'Agachamento',grupo:'Pernas'});
  db.planosDatados.push({id:'p1',clienteId:'c1',data:'2026-12-15',nome:'Cliente Teste - 15/12/2026',tipo:'Pernas',duracao:45,exercicios:[{exercicioId:'e1',series:2,reps:10,carga:5,descanso:60,seriesDetalhe:[{reps:10,carga:5},{reps:10,carga:5}]}]});
  save();view='planos';render();
 });
 await page.locator('[data-plan-nav="share"]').click();
 await page.locator('#datedShareClient').selectOption('c1');
 await page.locator('[data-review-share="p1"]').click();
 await expect(page.locator('#datedSaveAndShare')).toBeVisible();
 await page.locator('[data-row="0"][data-set="0"][data-field="carga"]').fill('12,5');
 await page.locator('[data-row="0"][data-set="0"][data-field="carga"]').blur();
 await page.locator('#datedSave').click();
 await page.on('dialog',dialog=>dialog.accept());
 await expect.poll(()=>page.evaluate(()=>db.planosDatados.find(p=>p.id==='p1').exercicios[0].seriesDetalhe[0].carga)).toBe(12.5);
 expect(errors).toEqual([]);
});
