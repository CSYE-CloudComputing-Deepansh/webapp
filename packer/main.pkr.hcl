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
  ami_name      = "assignment4_ami_Deepansh_${formatdate("YYYY_MM_DD", timestamp())}"
  ssh_username  = "ubuntu"
  tags = {
    Name        = "custom-ubuntu-24.04-node-postgres"
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

  # Configure the systemd service for the application with environment variables
  provisioner "shell" {
    inline = [
      "echo '[Unit]' | sudo tee /etc/systemd/system/nodeapp.service",
      "echo 'Description=Node.js Application' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo '[Service]' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'Environment=DB_HOST=${var.db_host}' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'Environment=DB_NAME=${var.DB_NAME}' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'Environment=DB_USERNAME=${var.DB_USERNAME}' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'Environment=DB_PASSWORD=${var.DB_PASSWORD}' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'ExecStart=/usr/bin/node /opt/webapp/server.js' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'Restart=always' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo '[Install]' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'WantedBy=multi-user.target' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable nodeapp"
    ]
  }
}
