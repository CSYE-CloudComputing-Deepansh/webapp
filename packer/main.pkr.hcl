variable "artifact_path" {
  type    = string
  default = "./build-artifacts/app-package.zip" # Point to the zip file specifically
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "DB_NAME" {
  type    = string
  default = "postgres"
}

variable "DB_USERNAME" {
  type    = string
  default = "postgres"
}

variable "DB_PASSWORD" {
  type    = string
  default = "postgres"
}

packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0, <2.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "ubuntu_ami" {
  region        = var.aws_region
  source_ami    = "ami-0866a3c8686eaeeba"
  instance_type = "t2.small"
  ami_name      = "assignment6_ami_Deepansh_${formatdate("YYYY_MM_DD", timestamp())}"
  ssh_username  = "ubuntu"
  tags = {
    Name        = "assignmentCSYE"
    Environment = "dev"
  }
}

build {
  sources = ["source.amazon-ebs.ubuntu_ami"]

  # Set non-interactive mode for shell commands
  provisioner "shell" {
    inline = [
      "export DEBIAN_FRONTEND=noninteractive"
    ]
  }

  # Install Node.js and dependencies
  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get install -y nodejs npm",
      "sudo apt-get install -y unzip",
      "sudo apt-get clean"
    ]
  }

  # Install CloudWatch Agent
  provisioner "shell" {
    inline = [
      "wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb",
      # Install the package
      "sudo dpkg -i amazon-cloudwatch-agent.deb",
      # Clean up the downloaded package
      "rm amazon-cloudwatch-agent.deb"
    ]
  }

  # Create CloudWatch Agent configuration file
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc",
      "echo '{\"metrics\": {\"metrics_collected\": {\"disk\": {\"measurement\": [\"used_percent\"],\"resources\": [\"/\"]}, \"mem\": {\"measurement\": [\"mem_used_percent\"]}}}}' | sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json"
    ]
  }

  # Create non-login user 'csye6225' with restricted shell
  provisioner "shell" {
    inline = [
      "sudo groupadd -r csye6225",
      "sudo useradd -r -g csye6225 -s /usr/sbin/nologin csye6225"
    ]
  }

  # Ensure /opt/webapp exists and set ownership for ubuntu to allow copying
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/webapp",
      "sudo chown -R ubuntu:ubuntu /opt/webapp"
    ]
  }

  # Copy the zip file to the instance
  provisioner "file" {
    source      = var.artifact_path
    destination = "/opt/webapp/app-package.zip"
  }

  # Extract the zip file and clean up
  provisioner "shell" {
    inline = [
      "cd /opt/webapp",
      "sudo unzip app-package.zip -d /opt/webapp", # Extract contents of the zip to /opt/webapp
      "rm /opt/webapp/app-package.zip"             # Remove zip file after extraction
    ]
  }

  # Set ownership for csye6225 user after copying the artifacts
  provisioner "shell" {
    inline = [
      "sudo chown -R csye6225:csye6225 /opt/webapp",
      "sudo chmod -R 755 /opt/webapp"
    ]
  }

  # Create environment variables file for application
  provisioner "shell" {
    inline = [
      "echo 'DB_NAME=${var.DB_NAME}' | sudo tee -a /opt/webapp/.env",
      "echo 'DB_USERNAME=${var.DB_USERNAME}' | sudo tee -a /opt/webapp/.env",
      "echo 'DB_PASSWORD=${var.DB_PASSWORD}' | sudo tee -a /opt/webapp/.env",
      "echo 'AWS_REGION=${var.aws_region}' | sudo tee -a /opt/webapp/.env"
    ]
  }

  # Configure the systemd service for the application with environment variables
  provisioner "shell" {
    inline = [
      "echo '[Unit]' | sudo tee /etc/systemd/system/nodeapp.service",
      "echo 'Description=Node.js Application' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo '[Service]' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'ExecStart=/usr/bin/node /opt/webapp/server.js' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'EnvironmentFile=/opt/webapp/.env' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'Restart=always' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo '[Install]' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'WantedBy=multi-user.target' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable nodeapp"
    ]
  }

  # Start CloudWatch Agent Service
  provisioner "shell" {
    inline = [
      "sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s",
      "sudo systemctl restart amazon-cloudwatch-agent"
    ]
  }
}
