const fileSaver = require('file-saver');

export const handleSave = (json, fileName) => {
  const file = new File([json], fileName);
  fileSaver.saveAs(file);
}
