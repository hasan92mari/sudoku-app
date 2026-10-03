resource "aws_security_group" "frontend_alb" {
  name        = "${var.project_name}-frontend-alb-sg"
  description = "Public HTTP access to the frontend load balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Public HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ssh_nlb" {
  name        = "${var.project_name}-ssh-nlb-sg"
  description = "Public SSH tunnel through the network load balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from anywhere for the demo"
    from_port   = 50000
    to_port     = 50000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "frontend_instances" {
  name        = "${var.project_name}-frontend-instances-sg"
  description = "Frontend instances accept HTTP and SSH from their load balancers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from the public application load balancer"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend_alb.id]
  }

  ingress {
    description     = "SSH forwarded by the public network load balancer"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.ssh_nlb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "backend_alb" {
  name        = "${var.project_name}-backend-alb-sg"
  description = "Internal backend traffic from frontend instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Backend API from frontend instances"
    from_port       = 5001
    to_port         = 5001
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend_instances.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "backend_instances" {
  name        = "${var.project_name}-backend-instances-sg"
  description = "Backend API and SSH access from application instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Backend API from the internal load balancer"
    from_port       = 5001
    to_port         = 5001
    protocol        = "tcp"
    security_groups = [aws_security_group.backend_alb.id]
  }

  ingress {
    description     = "SSH from frontend instances for troubleshooting"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend_instances.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "redis" {
  name        = "${var.project_name}-redis-sg"
  description = "Private Redis access from application instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis TLS from frontend instances"
    from_port       = var.redis_port
    to_port         = var.redis_port
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend_instances.id]
  }

  ingress {
    description     = "Redis TLS from backend instances"
    from_port       = var.redis_port
    to_port         = var.redis_port
    protocol        = "tcp"
    security_groups = [aws_security_group.backend_instances.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
