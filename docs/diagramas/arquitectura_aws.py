from diagrams import Diagram, Cluster, Edge
from diagrams.aws.network import Route53, CloudFront, APIGateway, ELB
from diagrams.aws.storage import S3
from diagrams.aws.compute import ECS, Lambda
from diagrams.aws.database import RDS, Dynamodb, ElasticacheForRedis
from diagrams.aws.integration import SQS, SNS, Eventbridge
from diagrams.aws.security import Cognito, SecretsManager
from diagrams.aws.management import Cloudwatch
from diagrams.aws.engagement import SES
from diagrams.aws.ml import Sagemaker
from diagrams.onprem.client import Users, User
from diagrams.saas.chat import Slack
from diagrams.generic.blank import Blank
from diagrams.custom import Custom
ga={"fontsize":"18","bgcolor":"white","pad":"0.4"}

# 1. Ejercicio: app tipo Uber en AWS
with Diagram("Arquitectura app de transporte tipo Uber en AWS", filename="02_aws_uber", show=False, direction="LR", graph_attr=ga):
    u=Users("Pasajeros y\nconductores")
    dns=Route53("Route 53"); cdn=CloudFront("CloudFront")
    auth=Cognito("Cognito")
    with Cluster("VPC"):
        api=APIGateway("API Gateway\n(REST + WebSocket)")
        lb=ELB("ALB")
        with Cluster("ECS Fargate - microservicios"):
            viajes=ECS("Viajes"); match=ECS("Matching"); precios=ECS("Precios"); pagos=ECS("Pagos")
        cache=ElasticacheForRedis("Redis\n(ubicaciones)")
        db=RDS("Aurora PostgreSQL")
        ddb=Dynamodb("DynamoDB\n(tracking)")
        q=SQS("SQS"); notif=SNS("SNS (push)")
    mon=Cloudwatch("CloudWatch")
    u>>dns>>cdn>>api
    u>>Edge(style="dashed")>>auth
    api>>lb>>[viajes,match,precios,pagos]
    match>>cache; viajes>>db; viajes>>ddb; pagos>>db
    viajes>>q>>notif>>Edge(style="dashed")>>u
    [viajes,match]>>Edge(style="dotted")>>mon

# 2. PoC A02 en AWS
with Diagram("Arquitectura tentativa AWS - PoC A02 OrigenTours", filename="05_aws_poc_a02", show=False, direction="LR", graph_attr=ga):
    cliente=User("Cliente")
    asesor=User("Asesor")
    with Cluster("Canales de entrada"):
        ses=SES("SES\n(correo entrante)")
        wa=Lambda("Webhook\nWhatsApp")
        form=S3("Formulario web\n(S3 + CloudFront)")
    with Cluster("Frontend"):
        cdn=CloudFront("CloudFront")
        spa=S3("S3\nReact SPA")
    auth=Cognito("Cognito\n(asesores)")
    with Cluster("Backend (VPC privada)"):
        api=APIGateway("API Gateway")
        q=SQS("SQS\nsolicitudes")
        with Cluster("ECS Fargate"):
            be=ECS("API Node.js\n+ Orquestador A02")
        db=RDS("RDS PostgreSQL\nClientes / Solicitudes\n/ Análisis")
        logs=S3("S3\ntrazas de prompts")
        sec=SecretsManager("Secrets\nManager")
    with Cluster("Modelos GenAI"):
        bedrock=Sagemaker("Amazon Bedrock\n(Claude)")
        oai=Lambda("Conector\nOpenAI API")
    mon=Cloudwatch("CloudWatch\nmétricas PoC")
    eb=Eventbridge("EventBridge\nD1 -> A03 / A05")
    cliente>>[ses,wa,form]
    [ses,wa]>>q>>be
    form>>api
    asesor>>cdn>>spa
    asesor>>Edge(style="dashed")>>auth
    spa>>api>>be
    be>>[bedrock,oai]
    be>>db; be>>logs; be>>Edge(style="dotted")>>sec
    be>>eb
    be>>Edge(style="dotted")>>mon

# 3. Microservicios (equivalente al prompt DiagramGPT)
with Diagram("Arquitectura de microservicios - Sistema de análisis de solicitudes", filename="08_microservicios", show=False, direction="LR", graph_attr=ga):
    usr=Users("Asesores y\nclientes")
    dns=Route53("Route 53")
    cdn=CloudFront("CloudFront (CDN)")
    spa=S3("S3\nFrontend React")
    api=APIGateway("API Gateway")
    alb=ELB("Application\nLoad Balancer")
    auth=Cognito("Cognito")
    with Cluster("ECS Fargate"):
        with Cluster("MS Solicitudes"):
            ms1=ECS("solicitudes-svc"); d1=RDS("RDS\nsolicitudes")
        with Cluster("MS Análisis GenAI"):
            ms2=ECS("analisis-svc"); d2=Dynamodb("DynamoDB\nanálisis")
        with Cluster("MS Clientes"):
            ms3=ECS("clientes-svc"); d3=RDS("RDS\nclientes")
        with Cluster("MS Notificaciones"):
            ms4=ECS("notificaciones-svc"); d4=Dynamodb("DynamoDB\nmensajes")
    llm=Sagemaker("Amazon Bedrock")
    bus=Eventbridge("EventBridge")
    mon=Cloudwatch("CloudWatch")
    usr>>dns>>cdn>>spa
    cdn>>api>>alb
    api>>Edge(style="dashed")>>auth
    alb>>[ms1,ms2,ms3,ms4]
    ms1>>d1; ms2>>d2; ms3>>d3; ms4>>d4
    ms2>>llm
    [ms1,ms2]>>bus>>ms4
