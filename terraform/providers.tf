terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "sudoku-tfstate-rg"
    storage_account_name = "sudokutfstate18068"
    container_name       = "tfstate"
    key                  = "sudoku-infra.tfstate"
  }
}

provider "azurerm" {
  features {}

}