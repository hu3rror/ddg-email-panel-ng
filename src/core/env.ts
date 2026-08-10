/**
 * 获取当前部署的 Git Commit Short SHA (7位)
 * 优先读取 Vercel 环境变量，若无则回退到 dev
 */
export function getCommitSha(): string {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA

  if (sha && sha.length >= 7) {
    return sha.slice(0, 7)
  }

  return 'dev'
}