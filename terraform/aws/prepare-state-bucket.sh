#!/usr/bin/env bash
set -euo pipefail

if ! aws s3api head-bucket --bucket "$TF_STATE_BUCKET" >/dev/null 2>&1; then
  if [[ "$AWS_REGION" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$TF_STATE_BUCKET" --region "$AWS_REGION"
  else
    aws s3api create-bucket \
      --bucket "$TF_STATE_BUCKET" \
      --region "$AWS_REGION" \
      --create-bucket-configuration "LocationConstraint=$AWS_REGION"
  fi
fi

bucket_region=$(aws s3api get-bucket-location \
  --bucket "$TF_STATE_BUCKET" \
  --query 'LocationConstraint' \
  --output text)
if [[ "$bucket_region" == "None" ]]; then
  bucket_region="us-east-1"
fi
if [[ "$bucket_region" != "$AWS_REGION" ]]; then
  echo "Terraform state bucket must be in $AWS_REGION (found $bucket_region)." >&2
  exit 1
fi

aws s3api put-public-access-block \
  --bucket "$TF_STATE_BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-versioning \
  --bucket "$TF_STATE_BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket "$TF_STATE_BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
