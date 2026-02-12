try {
  const hexo = require('hexo');
  console.log('hexo loaded:', typeof hexo);
} catch (e) {
  console.error('hexo load failed');
  console.error(e);
  process.exit(1);
}
