const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const envs = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k) envs[k.trim()] = v.join('=').trim().replace(/"/g, '');
});
const supabase = createClient(envs.NEXT_PUBLIC_SUPABASE_URL, envs.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('ado_work_items').select('work_item_type, state, iteration_name, team_name').ilike('iteration_name', '%Sprint 12%');
  console.log('Total Sprint 12 items:', data.length);
  const closedParents = data.filter(t => ['User Story', 'Bug', 'Feature', 'Epic'].includes(t.work_item_type) && ['Closed', 'Ready for Prod', 'Resolved', 'Done', 'Completed', 'closed', 'ready for prod', 'resolved', 'done', 'completed'].includes(t.state));
  console.log('Closed Parents for Sprint 12:', closedParents.length);
  const crm = closedParents.filter(t => t.team_name && t.team_name.includes('CRM'));
  console.log('CRM tickets:', crm.length);
  console.log('Sample CRM iteration:', crm[0]?.iteration_name);
}
run();
