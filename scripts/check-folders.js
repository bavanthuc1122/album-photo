const fs = require('fs');
const path = require('path');

function checkFolders() {
  // 1. Kiểm tra folder gốc
  const rootPath = path.join(process.cwd(), 'storage/dataclient');
  console.log('\nChecking root folder:', rootPath);
  if (fs.existsSync(rootPath)) {
    const rootContents = fs.readdirSync(rootPath);
    console.log('Root contents:', rootContents);
  } else {
    console.log('Root folder does not exist');
  }

  // 2. Kiểm tra folder user
  const userPath = path.join(rootPath, 'user_admin4');
  console.log('\nChecking user folder:', userPath);
  if (fs.existsSync(userPath)) {
    const userContents = fs.readdirSync(userPath);
    console.log('User folder contents:', userContents);

    // 3. Kiểm tra folder data
    const dataPath = path.join(userPath, 'data');
    console.log('\nChecking data folder:', dataPath);
    if (fs.existsSync(dataPath)) {
      const dataContents = fs.readdirSync(dataPath);
      console.log('Data folder contents:', dataContents);
    } else {
      console.log('Data folder does not exist');
    }
  } else {
    console.log('User folder does not exist');
  }

  // Kiểm tra folder Khách
  const khachPath = path.join(process.cwd(), 'storage/dataclient/user_admin4/data/Khách');
  console.log('\nChecking Khách folder:', khachPath);
  if (fs.existsSync(khachPath)) {
    const khachContents = fs.readdirSync(khachPath);
    console.log('Khách folder contents:', khachContents);
  }

  // Kiểm tra symlink hoặc rename
  const targetPath = path.join(process.cwd(), 'storage/dataclient/user_admin4/data/F534925664');
  console.log('\nChecking if we can create symlink or rename:');
  console.log('Source exists:', fs.existsSync(khachPath));
  console.log('Target exists:', fs.existsSync(targetPath));
}

checkFolders();
