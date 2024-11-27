package com.example.microservice_relamations;

import com.example.microservice_relamations.DTO.ReclamationDTO;
import com.example.microservice_relamations.DTO.UserDTO;
import com.example.microservice_relamations.Entities.Reclamation;
import com.example.microservice_relamations.Enum.Etat;
import com.example.microservice_relamations.Implementations.ReclamationServiceImp;
import com.example.microservice_relamations.Relations.UserClient;
import com.example.microservice_relamations.Repository.ReclamationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
class MicroserviceRelamationsApplicationTests {

	@Test
	void contextLoads() {
	}

	@MockBean
	private ReclamationRepository reclamationRepository;

	@Mock
	private UserClient userClient;

	@InjectMocks
	private ReclamationServiceImp reclamationService;

	@BeforeEach
	public void setup() {
		MockitoAnnotations.openMocks(this);
	}

	@Test
	public void testGetAllReclamations() {
		Reclamation reclamation = new Reclamation();
		reclamation.setId(1L);
		when(reclamationRepository.findAll()).thenReturn(Arrays.asList(reclamation));

		List<ReclamationDTO> reclamations = reclamationService.getAllReclamations();
		assertEquals(1, reclamations.size());
		assertEquals(1L, reclamations.get(0).getId());
	}

	@Test
	public void testGetReclamationById() {
		Reclamation reclamation = new Reclamation();
		reclamation.setId(1L);
		when(reclamationRepository.findById(1L)).thenReturn(Optional.of(reclamation));

		ReclamationDTO reclamationDTO = reclamationService.getReclamationById(1L);
		assertNotNull(reclamationDTO);
		assertEquals(1L, reclamationDTO.getId());
	}

	@Test
	public void testCreateReclamation() {
		// Préparer la réclamation avec l'ID 25L et les détails
		Reclamation reclamation = new Reclamation();
		reclamation.setId(27L);
		reclamation.setTitre("Problème de facturation");
		reclamation.setCapture("facture.jpg");
		reclamation.setDescription("La facture n'est pas correcte.");
		reclamation.setEtat(Etat.EN_COURS);

		// Configurer le mock pour retourner cette réclamation lors de l'appel de save
		when(reclamationRepository.save(any(Reclamation.class))).thenReturn(reclamation);

		// Préparer le DTO avec les détails
		ReclamationDTO reclamationDTO = new ReclamationDTO();
		reclamationDTO.setId(27L);
		reclamationDTO.setTitre("Problème de facturation");
		reclamationDTO.setCapture("facture.jpg");
		reclamationDTO.setDescription("La facture n'est pas correcte.");
		reclamationDTO.setEtat(Etat.EN_COURS);

		// Configurer le mock du JWT pour retourner le nom d'utilisateur
		Jwt jwt = mock(Jwt.class);
		when(jwt.getClaim("preferred_username")).thenReturn("test_user");

		// Configurer le mock du UserClient pour retourner l'utilisateur avec l'ID 15L
		UserDTO userDTO = new UserDTO();
		userDTO.setId(15L);
		when(userClient.getUserByUsername("test_user")).thenReturn(userDTO);

		// Appeler la méthode de service pour créer la réclamation
		ReclamationDTO result = reclamationService.createReclamation(reclamationDTO, jwt);

		// Vérifier que le résultat n'est pas null et que les détails sont corrects
		assertNotNull(result);
		assertEquals(27L, result.getId());
		assertEquals("Problème de facturation", result.getTitre());
		assertEquals("facture.jpg", result.getCapture());
		assertEquals("La facture n'est pas correcte.", result.getDescription());
		assertEquals(Etat.EN_COURS, result.getEtat());
	}


	@Test
	public void testUpdateReclamation() {
		Reclamation existingReclamation = new Reclamation();
		existingReclamation.setId(1L);
		when(reclamationRepository.findById(1L)).thenReturn(Optional.of(existingReclamation));
		when(reclamationRepository.save(any(Reclamation.class))).thenReturn(existingReclamation);

		ReclamationDTO reclamationDTO = new ReclamationDTO();
		reclamationDTO.setId(1L);
		reclamationDTO.setTitre("Updated Title");

		ReclamationDTO result = reclamationService.updateReclamation(1L, reclamationDTO);
		assertNotNull(result);
		assertEquals("Updated Title", result.getTitre());
	}

	@Test
	public void testDeleteReclamation() {
		doNothing().when(reclamationRepository).deleteById(1L);
		reclamationService.deleteReclamation(1L);
		verify(reclamationRepository, times(1)).deleteById(1L);
	}

	@Test
	public void testAssignScraper() {
		Reclamation existingReclamation = new Reclamation();
		existingReclamation.setId(1L);
		when(reclamationRepository.findById(1L)).thenReturn(Optional.of(existingReclamation));
		when(reclamationRepository.save(any(Reclamation.class))).thenReturn(existingReclamation);

		ReclamationDTO result = reclamationService.assignScraper(1L, 2L);
		assertNotNull(result);
		assertEquals(2L, result.getScraperId());
	}

	@Test
	public void testGetReclamationsAffectees() {
		Reclamation reclamation = new Reclamation();
		reclamation.setScraperId(1L);
		when(reclamationRepository.findByScraperIdNotNull()).thenReturn(Arrays.asList(reclamation));

		List<ReclamationDTO> reclamations = reclamationService.getReclamationsAffectees();
		assertEquals(1, reclamations.size());
		assertNotNull(reclamations.get(0).getScraperId());
	}

	@Test
	public void testGetReclamationsNonAffectees() {
		Reclamation reclamation = new Reclamation();
		when(reclamationRepository.findByScraperIdIsNull()).thenReturn(Arrays.asList(reclamation));

		List<ReclamationDTO> reclamations = reclamationService.getReclamationsNonAffectees();
		assertEquals(1, reclamations.size());
		assertNull(reclamations.get(0).getScraperId());
	}

	@Test
	public void testGetReclamationsByUserId() {
		Reclamation reclamation = new Reclamation();
		reclamation.setIdUser(1L);
		when(reclamationRepository.findByIdUser(1L)).thenReturn(Arrays.asList(reclamation));

		List<ReclamationDTO> reclamations = reclamationService.getReclamationsByScraperId(1L);
		assertEquals(1, reclamations.size());
		assertEquals(1L, reclamations.get(0).getIdUser());
	}

	@Test
	public void testConfirmerReclamation() {
		Reclamation existingReclamation = new Reclamation();
		existingReclamation.setId(1L);
		existingReclamation.setEtat(Etat.EN_COURS);
		when(reclamationRepository.findById(1L)).thenReturn(Optional.of(existingReclamation));
		when(reclamationRepository.save(any(Reclamation.class))).thenReturn(existingReclamation);

		ReclamationDTO result = reclamationService.confimerreclamation(1L);
		assertNotNull(result);
		assertEquals(Etat.TRAITEE, result.getEtat());
	}

	@Test
	public void testAnnulerReclamation() {
		Reclamation existingReclamation = new Reclamation();
		existingReclamation.setId(1L);
		existingReclamation.setEtat(Etat.EN_COURS);
		when(reclamationRepository.findById(1L)).thenReturn(Optional.of(existingReclamation));
		when(reclamationRepository.save(any(Reclamation.class))).thenReturn(existingReclamation);

		ReclamationDTO result = reclamationService.anuulerreclamation(1L);
		assertNotNull(result);
		assertEquals(Etat.ANNULEE, result.getEtat());
	}
}
