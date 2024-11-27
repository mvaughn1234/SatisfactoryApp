"""
Using a class like a CalculatorService to group all your calculator methods is good for a few reasons:
1) It helps keep everything together
2) It helps avoid namespace issues, for example two services using the same method name like CalculatorService.fetchData
and BuildingService.fetchData.
3) With endpoint services, often times instance variables aren't needed; they opperate purely on the data passed in. So
in most cases, there's no immediate need to create an instance of the service class. Static methods allow you to use the
service without instantiating it.
"""
from app.services.configuration_service import ConfigurationService


class CalculatorService:
    @staticmethod
    def calculate_production_for_user(user_key, targets):
        # Load configuration
        config = ConfigurationService.load_user_configuration(user_key)

