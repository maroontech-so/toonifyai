const isGithubPages = process.env.NODE_ENV === 'production';
const repo = 'toonifyai'; // your GitHub repo name

const nextConfig = {
  output: 'export',
  basePath: isGithubPages ? `/${repo}` : '',
  assetPrefix: isGithubPages ? `/${repo}/` : '',
};

export default nextConfig;
