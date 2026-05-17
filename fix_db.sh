#!/bin/bash
docker exec -i inhouse_qase_db_prod psql -U postgres -d inhouse_qase -c "UPDATE \"DeploymentLog\" SET status = 'SUCCESS' WHERE status = 'BUILDING';"
