try {
  require('./seeders/20251011140000-groups-data.js');
  require('./seeders/20251011140100-group-members-data.js');
  console.log('Seeders parsed OK');
} catch (e) {
  console.error('Error parsing seeders:', e);
  process.exit(1);
}
