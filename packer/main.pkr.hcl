variable "artifact_path" {
  type    = string
  default = "./build-artifacts"  # Points to the artifact built by GitHub Actions
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
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
  region                 = var.aws_region
  source_ami             = "ami-0866a3c8686eaeeba"
  instance_type          = "t2.small"
  ami_name               = "assignment4_ami_Deepansh_${formatdate("YYYY_MM_DD", timestamp())}"
  ssh_username           = "ubuntu"
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

  # Install PostgreSQL and Node.js
  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get install -y nodejs npm",
      "sudo apt-get install -y postgresql postgresql-contrib",
      "sudo systemctl enable postgresql",
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

  # Copy the application artifact from GitHub Actions to /opt/webapp
  provisioner "file" {
    source      = var.artifact_path
    destination = "/opt/webapp"
  }

  # Set ownership for csye6225 user after copying the artifacts
  provisioner "shell" {
    inline = [
      "sudo chown -R csye6225:csye6225 /opt/webapp",
      "sudo chmod -R 755 /opt/webapp"
    ]
  }

  # Configure the systemd service for the application
  provisioner "shell" {
    inline = [
      "echo '[Unit]' | sudo tee /etc/systemd/system/nodeapp.service",
      "echo 'Description=Node.js Application' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo '[Service]' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'ExecStart=/usr/bin/node /opt/webapp/build-artifacts/server.js' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'Restart=always' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo '[Install]' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'WantedBy=multi-user.target' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable nodeapp"
    ]
  }
}
