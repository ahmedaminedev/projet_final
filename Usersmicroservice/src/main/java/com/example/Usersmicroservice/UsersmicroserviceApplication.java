package com.example.Usersmicroservice;

import lombok.extern.log4j.Log4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@SpringBootApplication
@EnableEurekaClient
@Log4j
public class UsersmicroserviceApplication {

	public static void main(String[] args) {
		SpringApplication.run(UsersmicroserviceApplication.class, args);
	}

}
