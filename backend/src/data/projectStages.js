const { FARM_STAGES } = require('./farmStages');

const CODING_STAGES = [
  'Planning',
  'Requirements',
  'Design',
  'Coding',
  'Frontend',
  'Backend',
  'Database',
  'Testing',
  'Bug fixing',
  'Deployment',
  'Web hosting',
  'Domain name',
  'AI subscription',
  'VPS',
  'Dev tools',
  'Maintenance',
];

const ANIMAL_STAGES = [
  'Animal housing',
  'Feeding',
  'Water',
  'Vaccination',
  'Treatment',
  'Breeding',
  'Hens chicks',
  'Hens brooding',
  'Hens feeding',
  'Hens vaccination',
  'Hens layers',
  'Hens eggs',
  'Hens sale',
  'Pigs piglets',
  'Pigs weaning',
  'Pigs feeding',
  'Pigs vaccination',
  'Pigs fattening',
  'Pigs sale',
  'Cattle',
  'Goats',
  'Sheep',
  'Rabbits',
  'Fish',
];

const ALL_STAGES = [...CODING_STAGES, ...FARM_STAGES, ...ANIMAL_STAGES];

module.exports = { FARM_STAGES, CODING_STAGES, ANIMAL_STAGES, ALL_STAGES };
