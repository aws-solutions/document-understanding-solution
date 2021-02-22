import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Box,
} from '@chakra-ui/react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { ExportTypes, downloadRedactedDocument } from '../../utils/downloadRedactedDocument';
import Button from '../Button/Button';
import { getDocumentById } from '../../store/entities/documents/selectors';
import { getDocumentPageCount } from '../../utils/document';
import { Document, Page } from 'react-pdf';
import Loading from '../Loading/Loading';
import { DocumentMarks, useDocumentResizer } from '../DocumentViewer/DocumentViewer';
import DownloadIcon from './DownloadIcon'

const ExportPreview = ({ document }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { containerRef, documentWidth, handleResize } = useDocumentResizer(true, []);

  const readableDocumentName = document.documentName.replace(/\.(pdf|PDF|png|PNG|jpg|JPG|jpeg|JPEG)/, '');
  const pageCount = getDocumentPageCount(document);

  return (
    <>
      <Button onClick={onOpen}>Export Redacted Doc</Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size='6xl' scrollBehavior='inside'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg='#f2f4f4' d='flex' alignItems='center' color='#000'>
            <Box flex='1'>Preview Redactions and Export</Box>

            <Menu>
              <MenuButton as={Button}>Download Redacted Doc</MenuButton>
              <MenuList bg='#666' color='#fff'>
                <MenuItem
                  bg='inherit'
                  border='none'
                  justifyContent="center"
                  fontSize='1rem'
                  onClick={() => downloadRedactedDocument(document, ExportTypes.PDF)}
                >
                  <DownloadIcon /> <Box ml={2} width="40px">PDF</Box>
                </MenuItem>
                <MenuItem
                  bg='inherit'
                  border='none'
                  justifyContent="center"
                  fontSize='1rem'
                  onClick={() => downloadRedactedDocument(document, ExportTypes.PNG)}
                >
                  <DownloadIcon /> <Box ml={2} width="40px">PNG</Box>
                </MenuItem>
              </MenuList>
            </Menu>

            <ModalCloseButton border='none' bg='#f2f4f4' position='static' />
          </ModalHeader>

          <ModalBody bg='#fff' color='#000'>
            <dl>
              <Box as='dt' d='inline-block'>
                Document Name:
              </Box>
              <Box as='dd' d='inline-block' ml={1} mr={10} fontWeight='bold'>
                {readableDocumentName}
              </Box>

              <Box as='dt' d='inline-block'>
                Total pages:
              </Box>
              <Box as='dd' d='inline-block' ml={1} fontWeight='bold'>
                {pageCount}
              </Box>
            </dl>

            <div ref={containerRef}>
              <Document
                file={document.searchablePdfURL}
                loading={<Loading />}
                onLoadSuccess={() => setTimeout(handleResize, 0)}
              >
                {Array(pageCount)
                  .fill(null)
                  .map((_, i) => i + 1)
                  .map((pageNumber) => (
                    <Box key={pageNumber} mb={10}>
                      <DocumentMarks redactions={document.redactions[pageNumber]} isExportPreview>
                        <Page
                          width={documentWidth}
                          loading={<Loading />}
                          pageNumber={pageNumber}
                          renderAnnotationLayer={false}
                        />
                      </DocumentMarks>
                    </Box>
                  ))}
              </Document>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default connect((state) => {
  const { id } = queryString.parse(location.search);

  return {
    document: getDocumentById(state, id),
  };
})(ExportPreview);
