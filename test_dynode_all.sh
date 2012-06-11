#!/bin/sh

ACCESS=""
SECRET=""

if [ "$ACCESS" != "" ]
then
  if [ "$SECRET" != "" ]
  then
    AWS_ACCEESS_KEY_ID=$ACCESS AWS_SECRET_ACCESS_KEY=$SECRET make test-all
  else
    echo "AWS_SECRET_ACCESS_KEY must be defined in this file"
  fi
else
  echo "AWS_ACCESS_KEY_ID must be defined in this file"
fi