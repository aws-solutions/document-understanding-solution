# docker-images

Docker container images built in GitLab CI/CD

## Images

Each subdirectory of this project contains a [`Dockerfile`](https://docs.docker.com/engine/reference/builder/). The [GitLab CI/CD pipeline for this project](./.gitlab-ci.yml) builds each of these Dockerfiles using [Kaniko](https://docs.gitlab.com/ee/ci/docker/using_kaniko.html), and pushes the resulting images to [an AWS ECR Repository](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html). The built images are named by their subdirectory. Each image is tagged with a few different tags, to make referring to the image easier:

| Image Tag | Example | Notes |
| --- | --- | --- |
| `$SUB_DIRECTORY/latest` | `example-image/latest` | Only created on `master` branch pipelines. Consumers should use this by default. |
| `$SUB_DIRECTORY/$CI_COMMIT_REF_SLUG` | `example-image/my-feature-branch` | Useful to pull an image from a feature branch build. See [GitLab CI/CD predefined variables](https://docs.gitlab.com/ee/ci/variables/predefined_variables.html). |
| `$SUB_DIRECTORY/$CI_COMMIT_SHA` | `example-image/54b820607719a2ba8434cfb7b297cebfe5646ab5` | Useful to pull an old image at a specific git commit. See [GitLab CI/CD predefined variables](https://docs.gitlab.com/ee/ci/variables/predefined_variables.html). |

### [`example-image`](./example-image/Dockerfile)

A basic image built from alpine to demonstrate the image build process.

## ECR

The ECR Repositories that contain these images are deployed in an AWS account with [CloudFormation contained in the `cloudformation/` directory of this repo](./cloudformation/). Repositories contain one image, but can hold many different versions ("tags") of that image. Repositories are contained within one ECR Registry in an AWS account, available as `<account-id>.dkr.ecr.<region>.amazonaws.com`.

Registries are private and require authentication. [The `ecr-login` `credHelper`](https://github.com/awslabs/amazon-ecr-credential-helper) (see [Docker Credential Helpers](https://docs.docker.com/engine/reference/commandline/login/#credential-helpers)) can automatically authenticate with ECR without having to manually call the AWS api (e.g. `aws ecr get-login-password`).
