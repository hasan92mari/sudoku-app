resource "aws_lb" "frontend" {
  name               = "${var.project_name}-frontend-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.frontend_alb.id]
  subnets            = aws_subnet.public[*].id

  tags = local.common_tags

  depends_on = [aws_route_table_association.public]
}

resource "aws_lb_target_group" "frontend" {
  name        = "${var.project_name}-frontend-tg"
  port        = 80
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    path                = "/health"
    matcher             = "200-399"
    protocol            = "HTTP"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "frontend" {
  load_balancer_arn = aws_lb.frontend.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_lb" "ssh" {
  name               = "${var.project_name}-ssh-nlb"
  internal           = false
  load_balancer_type = "network"
  security_groups    = [aws_security_group.ssh_nlb.id]
  subnets            = aws_subnet.public[*].id

  tags = local.common_tags

  depends_on = [aws_route_table_association.public]
}

resource "aws_lb_target_group" "frontend_ssh" {
  name        = "${var.project_name}-ssh-tg"
  port        = 22
  protocol    = "TCP"
  target_type = "instance"
  vpc_id      = aws_vpc.main.id

  health_check {
    protocol = "TCP"
    port     = "traffic-port"
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "ssh" {
  load_balancer_arn = aws_lb.ssh.arn
  port              = 50000
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_ssh.arn
  }
}

resource "aws_lb" "backend" {
  name               = "${var.project_name}-backend-alb"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [aws_security_group.backend_alb.id]
  subnets            = aws_subnet.application[*].id

  tags = local.common_tags

  depends_on = [aws_route_table_association.application]
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-backend-tg"
  port        = 5001
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    path                = "/health"
    matcher             = "200-399"
    protocol            = "HTTP"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.backend.arn
  port              = 5001
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}
