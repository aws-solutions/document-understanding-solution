FROM public.ecr.aws/lambda/python:3.8

# install system dependencies, which change rarely
RUN yum -y install git poppler-utils java-1.8.0-openjdk && yum clean all

ENV PYTHONPATH="${PYTHONPATH}:${LAMBDA_TASK_ROOT}"

WORKDIR ${LAMBDA_TASK_ROOT}

COPY requirements.txt ./
ADD document_barcodes ${LAMBDA_TASK_ROOT}/document_barcodes
# ones the repo is public we can just install this dependency
#RUN pip3 install --no-cache-dir git+ssh://git@github.com/ArlindNocaj/document_barcodes.git
RUN pip3 install --no-cache-dir -r requirements.txt
RUN pip3 install --no-cache-dir -e document_barcodes #--target "${LAMBDA_TASK_ROOT}"

# Copy function code
COPY src/ ./

RUN python lambda.py
RUN cd $(dirname $(python -c "import docbarcode; print(docbarcode.__file__)"))/../../ && pytest ./tests
# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "lambda.handler" ]