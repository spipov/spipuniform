// Fallback data for Irish counties and localities
// Used when API calls fail or database is not available

export interface County {
  id: string;
  name: string;
}

export interface Locality {
  id: string;
  name: string;
  countyId: string;
}

export interface School {
  id: string;
  name: string;
  address?: string;
  countyId: string;
  localityId: string;
  level: 'primary' | 'secondary';
}

// Irish counties with UUIDs
export const fallbackCounties: County[] = [
  { id: 'cork-county', name: 'Cork' },
  { id: 'dublin-county', name: 'Dublin' },
  { id: 'galway-county', name: 'Galway' },
  { id: 'kerry-county', name: 'Kerry' },
  { id: 'limerick-county', name: 'Limerick' },
  { id: 'waterford-county', name: 'Waterford' },
  { id: 'wexford-county', name: 'Wexford' },
  { id: 'wicklow-county', name: 'Wicklow' },
  { id: 'meath-county', name: 'Meath' },
  { id: 'kildare-county', name: 'Kildare' },
  { id: 'tipperary-county', name: 'Tipperary' },
  { id: 'clare-county', name: 'Clare' },
  { id: 'mayo-county', name: 'Mayo' },
  { id: 'donegal-county', name: 'Donegal' },
  { id: 'roscommon-county', name: 'Roscommon' },
  { id: 'sligo-county', name: 'Sligo' },
  { id: 'leitrim-county', name: 'Leitrim' },
  { id: 'cavan-county', name: 'Cavan' },
  { id: 'monaghan-county', name: 'Monaghan' },
  { id: 'louth-county', name: 'Louth' },
  { id: 'longford-county', name: 'Longford' },
  { id: 'westmeath-county', name: 'Westmeath' },
  { id: 'offaly-county', name: 'Offaly' },
  { id: 'laois-county', name: 'Laois' },
  { id: 'kilkenny-county', name: 'Kilkenny' },
  { id: 'carlow-county', name: 'Carlow' }
];

// Major localities/towns for each county
export const fallbackLocalities: Locality[] = [
  // Cork
  { id: 'cork-city', name: 'Cork City', countyId: 'cork-county' },
  { id: 'ballincollig', name: 'Ballincollig', countyId: 'cork-county' },
  { id: 'carrigaline', name: 'Carrigaline', countyId: 'cork-county' },
  { id: 'cobh', name: 'Cobh', countyId: 'cork-county' },
  { id: 'midleton', name: 'Midleton', countyId: 'cork-county' },
  { id: 'mallow', name: 'Mallow', countyId: 'cork-county' },
  { id: 'youghal', name: 'Youghal', countyId: 'cork-county' },
  { id: 'bandon', name: 'Bandon', countyId: 'cork-county' },
  { id: 'clonakilty', name: 'Clonakilty', countyId: 'cork-county' },
  { id: 'skibbereen', name: 'Skibbereen', countyId: 'cork-county' },

  // Dublin
  { id: 'dublin-city', name: 'Dublin City', countyId: 'dublin-county' },
  { id: 'tallaght', name: 'Tallaght', countyId: 'dublin-county' },
  { id: 'blanchardstown', name: 'Blanchardstown', countyId: 'dublin-county' },
  { id: 'swords', name: 'Swords', countyId: 'dublin-county' },
  { id: 'lucan', name: 'Lucan', countyId: 'dublin-county' },
  { id: 'malahide', name: 'Malahide', countyId: 'dublin-county' },
  { id: 'portmarnock', name: 'Portmarnock', countyId: 'dublin-county' },
  { id: 'castleknock', name: 'Castleknock', countyId: 'dublin-county' },
  { id: 'rathfarnham', name: 'Rathfarnham', countyId: 'dublin-county' },
  { id: 'templeogue', name: 'Templeogue', countyId: 'dublin-county' },

  // Galway
  { id: 'galway-city', name: 'Galway City', countyId: 'galway-county' },
  { id: 'salthill', name: 'Salthill', countyId: 'galway-county' },
  { id: 'oramnore', name: 'Oranmore', countyId: 'galway-county' },
  { id: 'athenry', name: 'Athenry', countyId: 'galway-county' },
  { id: 'ballinasloe', name: 'Ballinasloe', countyId: 'galway-county' },
  { id: 'tuam', name: 'Tuam', countyId: 'galway-county' },
  { id: 'clifden', name: 'Clifden', countyId: 'galway-county' },
  { id: 'loughrea', name: 'Loughrea', countyId: 'galway-county' },

  // Kerry
  { id: 'tralee', name: 'Tralee', countyId: 'kerry-county' },
  { id: 'killarney', name: 'Killarney', countyId: 'kerry-county' },
  { id: 'listowel', name: 'Listowel', countyId: 'kerry-county' },
  { id: 'castleisland', name: 'Castleisland', countyId: 'kerry-county' },
  { id: 'kenmare', name: 'Kenmare', countyId: 'kerry-county' },
  { id: 'dingle', name: 'Dingle', countyId: 'kerry-county' },
  { id: 'cahirciveen', name: 'Cahirciveen', countyId: 'kerry-county' },

  // Limerick
  { id: 'limerick-city', name: 'Limerick City', countyId: 'limerick-county' },
  { id: 'ennis', name: 'Ennis', countyId: 'clare-county' }, // Ennis is in Clare but close to Limerick
  { id: 'newcastle-west', name: 'Newcastle West', countyId: 'limerick-county' },
  { id: 'rathkeale', name: 'Rathkeale', countyId: 'limerick-county' },
  { id: 'askeaton', name: 'Askeaton', countyId: 'limerick-county' },

  // Waterford
  { id: 'waterford-city', name: 'Waterford City', countyId: 'waterford-county' },
  { id: 'dungarvan', name: 'Dungarvan', countyId: 'waterford-county' },
  { id: 'tramore', name: 'Tramore', countyId: 'waterford-county' },
  { id: 'lismore', name: 'Lismore', countyId: 'waterford-county' },

  // Wexford
  { id: 'wexford-town', name: 'Wexford Town', countyId: 'wexford-county' },
  { id: 'enniscorthy', name: 'Enniscorthy', countyId: 'wexford-county' },
  { id: 'gorey', name: 'Gorey', countyId: 'wexford-county' },
  { id: 'new-ross', name: 'New Ross', countyId: 'wexford-county' },

  // Wicklow
  { id: 'bray', name: 'Bray', countyId: 'wicklow-county' },
  { id: 'wicklow-town', name: 'Wicklow Town', countyId: 'wicklow-county' },
  { id: 'arklow', name: 'Arklow', countyId: 'wicklow-county' },
  { id: 'greystones', name: 'Greystones', countyId: 'wicklow-county' },

  // Meath
  { id: 'navan', name: 'Navan', countyId: 'meath-county' },
  { id: 'ashbourne', name: 'Ashbourne', countyId: 'meath-county' },
  { id: 'trim', name: 'Trim', countyId: 'meath-county' },
  { id: 'kells', name: 'Kells', countyId: 'meath-county' },

  // Kildare
  { id: 'naas', name: 'Naas', countyId: 'kildare-county' },
  { id: 'newbridge', name: 'Newbridge', countyId: 'kildare-county' },
  { id: 'celbridge', name: 'Celbridge', countyId: 'kildare-county' },
  { id: 'maynooth', name: 'Maynooth', countyId: 'kildare-county' },

  // Tipperary
  { id: 'clonmel', name: 'Clonmel', countyId: 'tipperary-county' },
  { id: 'thurles', name: 'Thurles', countyId: 'tipperary-county' },
  { id: 'cashel', name: 'Cashel', countyId: 'tipperary-county' },
  { id: 'roscrea', name: 'Roscrea', countyId: 'tipperary-county' },

  // Clare
  { id: 'ennis-clare', name: 'Ennis', countyId: 'clare-county' },
  { id: 'shannon', name: 'Shannon', countyId: 'clare-county' },
  { id: 'kilrush', name: 'Kilrush', countyId: 'clare-county' },
  { id: 'newmarket-on-fergus', name: 'Newmarket-on-Fergus', countyId: 'clare-county' },

  // Mayo
  { id: 'castlebar', name: 'Castlebar', countyId: 'mayo-county' },
  { id: 'ballina', name: 'Ballina', countyId: 'mayo-county' },
  { id: 'westport', name: 'Westport', countyId: 'mayo-county' },
  { id: 'claremorris', name: 'Claremorris', countyId: 'mayo-county' },

  // Donegal
  { id: 'letterkenny', name: 'Letterkenny', countyId: 'donegal-county' },
  { id: 'donegal-town', name: 'Donegal Town', countyId: 'donegal-county' },
  { id: 'bundoran', name: 'Bundoran', countyId: 'donegal-county' },
  { id: 'ballyshannon', name: 'Ballyshannon', countyId: 'donegal-county' },

  // Other counties
  { id: 'roscommon-town', name: 'Roscommon Town', countyId: 'roscommon-county' },
  { id: 'sligo-town', name: 'Sligo Town', countyId: 'sligo-county' },
  { id: 'carrick-on-shannon', name: 'Carrick-on-Shannon', countyId: 'leitrim-county' },
  { id: 'cavan-town', name: 'Cavan Town', countyId: 'cavan-county' },
  { id: 'monaghan-town', name: 'Monaghan Town', countyId: 'monaghan-county' },
  { id: 'dundalk', name: 'Dundalk', countyId: 'louth-county' },
  { id: 'longford-town', name: 'Longford Town', countyId: 'longford-county' },
  { id: 'mullingar', name: 'Mullingar', countyId: 'westmeath-county' },
  { id: 'tullamore', name: 'Tullamore', countyId: 'offaly-county' },
  { id: 'portlaoise', name: 'Portlaoise', countyId: 'laois-county' },
  { id: 'kilkenny-city', name: 'Kilkenny City', countyId: 'kilkenny-county' },
  { id: 'carlow-town', name: 'Carlow Town', countyId: 'carlow-county' }
];

// Sample schools for fallback data
export const fallbackSchools: School[] = [
  // Cork Schools
  { id: 'cork-primary-1', name: 'St. Mary\'s Primary School', address: 'Main Street, Cork City', countyId: 'cork-county', localityId: 'cork-city', level: 'primary' },
  { id: 'cork-primary-2', name: 'Scoil Naomh Seosamh', address: 'Ballincollig', countyId: 'cork-county', localityId: 'ballincollig', level: 'primary' },
  { id: 'cork-secondary-1', name: 'Coláiste Chríost Rí', address: 'Cork City', countyId: 'cork-county', localityId: 'cork-city', level: 'secondary' },
  { id: 'cork-secondary-2', name: 'Presentation Secondary School', address: 'Ballincollig', countyId: 'cork-county', localityId: 'ballincollig', level: 'secondary' },

  // Dublin Schools
  { id: 'dublin-primary-1', name: 'St. Patrick\'s National School', address: 'Dublin City', countyId: 'dublin-county', localityId: 'dublin-city', level: 'primary' },
  { id: 'dublin-primary-2', name: 'Sacred Heart Primary School', address: 'Tallaght', countyId: 'dublin-county', localityId: 'tallaght', level: 'primary' },
  { id: 'dublin-secondary-1', name: 'St. Joseph\'s Secondary School', address: 'Dublin City', countyId: 'dublin-county', localityId: 'dublin-city', level: 'secondary' },
  { id: 'dublin-secondary-2', name: 'Tallaght Community School', address: 'Tallaght', countyId: 'dublin-county', localityId: 'tallaght', level: 'secondary' },

  // Galway Schools
  { id: 'galway-primary-1', name: 'Scoil Íde Primary School', address: 'Galway City', countyId: 'galway-county', localityId: 'galway-city', level: 'primary' },
  { id: 'galway-primary-2', name: 'Scoil Naomh Pádraig', address: 'Oranmore', countyId: 'galway-county', localityId: 'oramnore', level: 'primary' },
  { id: 'galway-secondary-1', name: 'Coláiste Éinde', address: 'Galway City', countyId: 'galway-county', localityId: 'galway-city', level: 'secondary' },
  { id: 'galway-secondary-2', name: 'Oranmore Community School', address: 'Oranmore', countyId: 'galway-county', localityId: 'oramnore', level: 'secondary' },

  // Kerry Schools
  { id: 'kerry-primary-1', name: 'St. John\'s Primary School', address: 'Tralee', countyId: 'kerry-county', localityId: 'tralee', level: 'primary' },
  { id: 'kerry-primary-2', name: 'Scoil Mhuire', address: 'Killarney', countyId: 'kerry-county', localityId: 'killarney', level: 'primary' },
  { id: 'kerry-secondary-1', name: 'Tralee Community College', address: 'Tralee', countyId: 'kerry-county', localityId: 'tralee', level: 'secondary' },
  { id: 'kerry-secondary-2', name: 'St. Brigid\'s Secondary School', address: 'Killarney', countyId: 'kerry-county', localityId: 'killarney', level: 'secondary' },

  // Limerick Schools
  { id: 'limerick-primary-1', name: 'St. Mary\'s Primary School', address: 'Limerick City', countyId: 'limerick-county', localityId: 'limerick-city', level: 'primary' },
  { id: 'limerick-primary-2', name: 'Scoil Naomh Seosamh', address: 'Newcastle West', countyId: 'limerick-county', localityId: 'newcastle-west', level: 'primary' },
  { id: 'limerick-secondary-1', name: 'Ardscoil Rís', address: 'Limerick City', countyId: 'limerick-county', localityId: 'limerick-city', level: 'secondary' },
  { id: 'limerick-secondary-2', name: 'Coláiste Chiaráin', address: 'Newcastle West', countyId: 'limerick-county', localityId: 'newcastle-west', level: 'secondary' },

  // Waterford Schools
  { id: 'waterford-primary-1', name: 'St. Declan\'s Primary School', address: 'Waterford City', countyId: 'waterford-county', localityId: 'waterford-city', level: 'primary' },
  { id: 'waterford-primary-2', name: 'Scoil Naomh Pádraig', address: 'Dungarvan', countyId: 'waterford-county', localityId: 'dungarvan', level: 'primary' },
  { id: 'waterford-secondary-1', name: 'De La Salle College', address: 'Waterford City', countyId: 'waterford-county', localityId: 'waterford-city', level: 'secondary' },
  { id: 'waterford-secondary-2', name: 'St. Augustine\'s College', address: 'Dungarvan', countyId: 'waterford-county', localityId: 'dungarvan', level: 'secondary' },

  // Wexford Schools
  { id: 'wexford-primary-1', name: 'St. Iberius Primary School', address: 'Wexford Town', countyId: 'wexford-county', localityId: 'wexford-town', level: 'primary' },
  { id: 'wexford-primary-2', name: 'Scoil Naomh Bríd', address: 'Enniscorthy', countyId: 'wexford-county', localityId: 'enniscorthy', level: 'primary' },
  { id: 'wexford-secondary-1', name: 'Wexford CBS', address: 'Wexford Town', countyId: 'wexford-county', localityId: 'wexford-town', level: 'secondary' },
  { id: 'wexford-secondary-2', name: 'Enniscorthy Vocational College', address: 'Enniscorthy', countyId: 'wexford-county', localityId: 'enniscorthy', level: 'secondary' },

  // Wicklow Schools
  { id: 'wicklow-primary-1', name: 'St. Patrick\'s Primary School', address: 'Bray', countyId: 'wicklow-county', localityId: 'bray', level: 'primary' },
  { id: 'wicklow-primary-2', name: 'Scoil Naomh Pádraig', address: 'Wicklow Town', countyId: 'wicklow-county', localityId: 'wicklow-town', level: 'primary' },
  { id: 'wicklow-secondary-1', name: 'St. Kilian\'s Community School', address: 'Bray', countyId: 'wicklow-county', localityId: 'bray', level: 'secondary' },
  { id: 'wicklow-secondary-2', name: 'Wicklow Town Community School', address: 'Wicklow Town', countyId: 'wicklow-county', localityId: 'wicklow-town', level: 'secondary' },

  // Meath Schools
  { id: 'meath-primary-1', name: 'St. Mary\'s Primary School', address: 'Navan', countyId: 'meath-county', localityId: 'navan', level: 'primary' },
  { id: 'meath-primary-2', name: 'Scoil Naomh Seosamh', address: 'Ashbourne', countyId: 'meath-county', localityId: 'ashbourne', level: 'primary' },
  { id: 'meath-secondary-1', name: 'St. Patrick\'s Classical School', address: 'Navan', countyId: 'meath-county', localityId: 'navan', level: 'secondary' },
  { id: 'meath-secondary-2', name: 'Ashbourne Community School', address: 'Ashbourne', countyId: 'meath-county', localityId: 'ashbourne', level: 'secondary' },

  // Kildare Schools
  { id: 'kildare-primary-1', name: 'St. Conleth\'s Primary School', address: 'Naas', countyId: 'kildare-county', localityId: 'naas', level: 'primary' },
  { id: 'kildare-primary-2', name: 'Scoil Naomh Bríd', address: 'Newbridge', countyId: 'kildare-county', localityId: 'newbridge', level: 'primary' },
  { id: 'kildare-secondary-1', name: 'Naas CBS', address: 'Naas', countyId: 'kildare-county', localityId: 'naas', level: 'secondary' },
  { id: 'kildare-secondary-2', name: 'Newbridge College', address: 'Newbridge', countyId: 'kildare-county', localityId: 'newbridge', level: 'secondary' }
];

// Helper functions
export const getCounties = (): County[] => fallbackCounties;

export const getLocalities = (): Locality[] => fallbackLocalities;

export const getLocalitiesByCounty = (countyId: string): Locality[] => {
  return fallbackLocalities.filter(locality => locality.countyId === countyId);
};

export const getCountyById = (countyId: string): County | undefined => {
  return fallbackCounties.find(county => county.id === countyId);
};

export const getLocalityById = (localityId: string): Locality | undefined => {
  return fallbackLocalities.find(locality => locality.id === localityId);
};