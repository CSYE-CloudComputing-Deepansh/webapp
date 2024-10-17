variable "artifact_path" {
  type    = string
  default = "./webapp"  # Set to the webapp directory as the source
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}
# Specify required plugins
packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0, <2.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "ubuntu_ami" {
  region  = var.aws_region
  profile = "dev" # Specify your AWS CLI profile, if needed
  #   source_ami_filter {
  #     filters = {
  #       name                = "ubuntu/images/hvm-ssd/ubuntu-focal-24.04-amd64-server-*"
  #       root-device-type    = "ebs"
  #     }
  #     owners      = ["099720109477"]
  #     most_recent = true
  #   }
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

  # Set non-interactive mode
  provisioner "shell" {
    inline = [
      "export DEBIAN_FRONTEND=noninteractive"
    ]
  }

  # Install PostgreSQL and Node.js
 provisioner "shell" {
  inline = [
    "sudo chown -R ubuntu:ubuntu /opt/webapp",
    "sudo chmod -R 755 /opt/webapp",
    "sudo systemctl daemon-reload",
    "sudo systemctl enable nodeapp"
  ]
}


  # Create non-login user
  provisioner "shell" {
    inline = [
      "sudo groupadd -r csye6225",
      "sudo useradd -r -g csye6225 -s /usr/sbin/nologin csye6225"
    ]
  }

  # Copy application artifact and configure permissions
provisioner "file" {
  source      = var.artifact_path
  destination = "/opt/webapp"
}

  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/webapp",
      "sudo cp -r /tmp/build-artifacts/* /opt/webapp",
      "sudo chown -R csye6225:csye6225 /opt/webapp",
      "sudo chmod -R 755 /opt/webapp"
    ]
  }

  # Configure systemd service
  provisioner "shell" {
    inline = [
      "echo 'Creating /etc/systemd/system/nodeapp.service with sudo permissions'",
      "echo '[Unit]' | sudo tee /etc/systemd/system/nodeapp.service",
      "echo 'Description=Node.js Application' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo '[Service]' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'ExecStart=/usr/bin/node /opt/webapp/server.js' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'Restart=always' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo '[Install]' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "echo 'WantedBy=multi-user.target' | sudo tee -a /etc/systemd/system/nodeapp.service",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable nodeapp"
    ]
  }
}
