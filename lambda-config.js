module.exports = {
  region: 'us-east-1',
  handler: 'index.handler',
  role: 'arn:aws:iam::289869164659:role/lambda_s3_exec_role_sample',
  functionName: 'gulpSample',
  timeout: 10
}
