const {test,expect}=require('@playwright/test');

test('backup JSON exports all data without changing records',async({page})=>{
 await page.goto('/');
 await page.evaluate(()=>{db.clientes.push({id:'backup-test',nome:'Cliente Backup',numero:'100'});save();view='dados';render()});
 await expect(page.locator('#export')).toBeVisible();
 const before=await page.evaluate(()=>localStorage.getItem('gymbody-data-v1'));
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
 expect(download.suggestedFilename()).toMatch(/^gymbody-backup-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/);
 expect(await page.evaluate(()=>localStorage.getItem('gymbody-data-v1'))).toBe(before);
 await expect(page.locator('body')).toContainText('Última preparação de ficheiro');
});

test('weekly reminder is dismissible and does not replace stored data',async({page})=>{
 await page.goto('/');
 await page.evaluate(()=>{db.clientes.push({id:'reminder-test',nome:'Teste',numero:'101'});save();localStorage.removeItem('gymbody-backup-last-prepared-v1');localStorage.removeItem('gymbody-backup-last-reminder-v1');window.GymBodyBackup.showReminder()});
 await expect(page.locator('#gymBackupReminder')).toBeVisible();
 await page.locator('#gymBackupLater').click();
 await expect(page.locator('#gymBackupReminder')).toHaveCount(0);
 await page.evaluate(()=>window.GymBodyBackup.showReminder());
 await expect(page.locator('#gymBackupReminder')).toHaveCount(0);
 expect(await page.evaluate(()=>db.clientes.some(c=>c.id==='reminder-test'))).toBe(true);
});
