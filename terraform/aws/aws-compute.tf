data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

resource "aws_key_pair" "admin" {
  key_name   = "${var.project_name}-admin"
  public_key = var.admin_ssh_public_key

  tags = local.common_tags
}

locals {
  backend_base_url = "http://${aws_lb.backend.dns_name}:5001"
  redis_url        = "rediss://:${urlencode(random_password.redis.result)}@${aws_elasticache_replication_group.main.primary_endpoint_address}:${var.redis_port}"
}

resource "aws_launch_template" "frontend" {
  name_prefix   = "${var.project_name}-frontend-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.admin.key_name

  vpc_security_group_ids = [aws_security_group.frontend_instances.id]
  user_data = base64encode(<<-USERDATA
    #!/bin/bash
    set -euxo pipefail
    apt-get update -y
    apt-get install -y docker.io
    systemctl enable --now docker
    docker pull ${var.frontend_image}
    docker run -d --restart unless-stopped --name frontend -p 80:80 \
      -e BACKEND_BASE_URL='${local.backend_base_url}' \
      -e FRONTEND_REDIS_URL='${local.redis_url}' \
      ${var.frontend_image}
    USERDATA
  )

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.common_tags, { Name = "${var.project_name}-frontend" })
  }
}

resource "aws_launch_template" "backend" {
  name_prefix   = "${var.project_name}-backend-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.admin.key_name

  vpc_security_group_ids = [aws_security_group.backend_instances.id]
  user_data = base64encode(<<-USERDATA
    #!/bin/bash
    set -euxo pipefail
    apt-get update -y
    apt-get install -y docker.io
    systemctl enable --now docker
    docker pull ${var.backend_image}
    docker run -d --restart unless-stopped --name backend -p 5001:5001 \
      -e PORT=5001 \
      -e REDIS_URL='${local.redis_url}' \
      ${var.backend_image}
    USERDATA
  )

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.common_tags, { Name = "${var.project_name}-backend" })
  }
}

resource "aws_autoscaling_group" "frontend" {
  name                      = "${var.project_name}-frontend-asg"
  min_size                  = var.frontend_instance_count
  max_size                  = var.frontend_instance_count
  desired_capacity          = var.frontend_instance_count
  vpc_zone_identifier       = aws_subnet.public[*].id
  target_group_arns         = [aws_lb_target_group.frontend.arn, aws_lb_target_group.frontend_ssh.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  depends_on = [aws_route_table_association.public]

  launch_template {
    id      = aws_launch_template.frontend.id
    version = "$Latest"
  }

  dynamic "tag" {
    for_each = merge(local.common_tags, { Name = "${var.project_name}-frontend" })
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

resource "aws_autoscaling_group" "backend" {
  name                      = "${var.project_name}-backend-asg"
  min_size                  = var.backend_instance_count
  max_size                  = var.backend_instance_count
  desired_capacity          = var.backend_instance_count
  vpc_zone_identifier       = aws_subnet.application[*].id
  target_group_arns         = [aws_lb_target_group.backend.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  depends_on = [aws_route_table_association.application]

  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  dynamic "tag" {
    for_each = merge(local.common_tags, { Name = "${var.project_name}-backend" })
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}
