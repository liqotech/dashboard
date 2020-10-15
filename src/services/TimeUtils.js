export function calculateAge(timestamp){
  const date = new Date;
  const date2 = new Date(timestamp);
  let diffTime = Math.abs(date - date2)/(1000*60*60*24*30);
  if(Math.floor(diffTime) === 0){
    diffTime = Math.abs(date - date2)/(1000*60*60*24) - 1;
    if(Math.floor(diffTime) < 1){
      diffTime = Math.abs(date - date2)/(1000*60*60);
      if(Math.floor(diffTime) === 0){
        diffTime = Math.abs(date - date2)/(1000*60);
        if(Math.floor(diffTime) === 0){
          diffTime = Math.abs(date - date2)/(1000);
          return Math.floor(diffTime) + 's';
        } else return Math.floor(diffTime) + 'm';
      } else return Math.floor(diffTime) + 'h';
    } else return Math.floor(diffTime + 1) + 'd';
  } else return Math.floor(diffTime) + 'M';
}
