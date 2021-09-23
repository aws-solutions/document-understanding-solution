source ./venv/bin/activate
pip install boto3
pip install moto==1.3.14
isengardcli creds arlnocaj+dus5@amazon.com --nocache

export STACKNAME=DUS4

yarn && yarn deploy
