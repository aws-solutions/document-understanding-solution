FROM public.ecr.aws/lambda/python:3.8

# install system dependencies, which change rarely
RUN yum -y install git poppler-utils java-1.8.0-openjdk && yum clean all

ENV PYTHONPATH="${PYTHONPATH}:${LAMBDA_TASK_ROOT}"

WORKDIR ${LAMBDA_TASK_ROOT}

COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt #--target "${LAMBDA_TASK_ROOT}"

# Copy function codepwd
COPY src/ ./

RUN python lambda.py
RUN python -c "from docbarcodes.extract import process_document; process_document('samples/qr-code-wikipedia.pdf')"
# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "lambda.handler" ]